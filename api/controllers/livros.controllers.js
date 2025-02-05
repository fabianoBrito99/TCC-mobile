const connection = require("../config/mysql.config");
const fs = require("fs");

// Exibe detalhes de um livro específico
function show(request, response) {
  const codigo = request.params.codigo;
  if (!codigo) {
    return response.status(400).json({ erro: "Código do livro não fornecido" });
  }

  connection.query(
    `SELECT Livro.*, Estoque.quantidade_estoque, Categoria.nome_categoria AS categoria, Autor.nome AS nome_autor
     FROM Livro
     LEFT JOIN Estoque ON Livro.fk_id_estoque = Estoque.id_estoque
     LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
     LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
     LEFT JOIN Autor_Livro ON Livro.id_livro = Autor_Livro.fk_id_livro
     LEFT JOIN Autor ON Autor_Livro.fk_id_autor = Autor.id_autor
     WHERE Livro.id_livro = ?;`,
    [codigo],
    (err, resultado) => {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o livro" });
      }
      if (resultado.length === 0) {
        return response
          .status(404)
          .json({ erro: `Livro com código #${codigo} não encontrado` });
      }

      const livro = resultado[0];

      // Convertendo BLOB para Base64 se a foto_capa existir
      if (livro.foto_capa) {
        livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(
          livro.foto_capa
        ).toString("base64")}`;
      }

      return response.json(livro);
    }
  );
}

// Lista todos os livros
function list(request, response) {
  connection.query(
    `SELECT
      Livro.*, 
      Categoria.categoria_principal,
      Autor.nome AS autor
     FROM Livro
     LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
     LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
     LEFT JOIN Autor_Livro ON Livro.id_livro = Autor_Livro.fk_id_livro
     LEFT JOIN Autor ON Autor_Livro.fk_id_autor = Autor.id_autor`,
    (err, resultado) => {
      if (err) {
        console.error("Erro ao buscar livros:", err);
        return response
          .status(500)
          .json({ erro: "Erro ao buscar livros", detalhes: err.message });
      }

      resultado.forEach((livro) => {
        if (livro.foto_capa) {
          // Convertendo BLOB para Base64
          livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(
            livro.foto_capa
          ).toString("base64")}`;
        }
      });

      return response.json({ livros: resultado });
    }
  );
}



function associarAutorAoLivro(livroId, autorId) {
  connection.query(
    `INSERT INTO Autor_Livro (fk_id_livro, fk_id_autor) VALUES (?, ?)`,
    [livroId, autorId]
  );
}

function associarCategoriaAoLivro(livroId, fk_id_categoria, response) {
  connection.query(
    `INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`,
    [livroId, fk_id_categoria],
    (err) => {
      if (err) return response.status(500).json({ erro: "Erro ao associar categoria ao livro" });
      response.status(201).json({ mensagem: "Livro criado com sucesso" });
    }
  );
}

// Função de criação de livro
async function create(request, response) {
  const {
    nomeLivro,
    descricao,
    anoPublicacao,
    quantidade_paginas,
    categoria_principal,
    autores,
    quantidade_estoque
  } = request.body;

  const foto_capa = request.file ? request.file.buffer : null;
  const anoPublicacaoFormatado = new Date(anoPublicacao);

  try {
    const estoqueResult = await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO Estoque (quantidade_estoque) VALUES (?)`,
        [quantidade_estoque],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });
    const fk_id_estoque = estoqueResult.insertId;

    const livroResult = await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, fk_id_estoque, foto_capa) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nomeLivro, descricao, anoPublicacaoFormatado, quantidade_paginas, fk_id_estoque, foto_capa],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });
    const livroId = livroResult.insertId;

    // Processar autores
    if (Array.isArray(autores) && autores.length > 0) {
      for (const autorNome of autores) {
        const autorResult = await new Promise((resolve, reject) => {
          connection.query(
            `SELECT id_autor FROM Autor WHERE nome = ?`,
            [autorNome],
            (err, result) => err ? reject(err) : resolve(result)
          );
        });

        let autorId;
        if (autorResult.length === 0) {
          const novoAutorResult = await new Promise((resolve, reject) => {
            connection.query(
              `INSERT INTO Autor (nome) VALUES (?)`,
              [autorNome],
              (err, result) => err ? reject(err) : resolve(result)
            );
          });
          autorId = novoAutorResult.insertId;
        } else {
          autorId = autorResult[0].id_autor;
        }

        await new Promise((resolve, reject) => {
          connection.query(
            `INSERT INTO Autor_Livro (fk_id_livro, fk_id_autor) VALUES (?, ?)`,
            [livroId, autorId],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
    }

    // Processar categoria
    const categoriaResult = await new Promise((resolve, reject) => {
      connection.query(
        `SELECT id_categoria FROM Categoria WHERE nome_categoria = ?`,
        [categoria_principal],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    let fk_id_categoria;
    if (categoriaResult.length === 0) {
      const categoriaCriadaResult = await new Promise((resolve, reject) => {
        connection.query(
          `INSERT INTO Categoria (nome_categoria) VALUES (?)`,
          [categoria_principal],
          (err, result) => err ? reject(err) : resolve(result)
        );
      });
      fk_id_categoria = categoriaCriadaResult.insertId;
    } else {
      fk_id_categoria = categoriaResult[0].id_categoria;
    }

    await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`,
        [livroId, fk_id_categoria],
        (err) => err ? reject(err) : resolve()
      );
    });

    response.status(201).json({ mensagem: "Livro criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar livro:", err);
    response.status(500).json({ erro: "Erro ao criar livro", detalhes: err.message });
  }
}



module.exports = {
  show,
  list,
  create,
};
