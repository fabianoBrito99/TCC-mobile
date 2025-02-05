const connection = require("../config/mysql.config");
const fs = require('fs');

function list(request, response) {
  connection.query(
    `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.id_livro, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
     FROM Emprestimos e
     JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
     JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
     JOIN Livro l ON e.fk_id_livros = l.id_livro
     WHERE e.data_devolucao IS NULL AND  e.status = 'aprovado'`,
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
      }

      resultado.forEach(emprestimo => {
        if (emprestimo.foto_capa) {
          emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
        }
      });

      return response.json({ dados: resultado });
    }
  );
}

function emprestimoAprovar(request, response){
  connection.query(
    `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
     FROM Emprestimos e
     JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
     JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
     JOIN Livro l ON e.fk_id_livros = l.id_livro
     WHERE e.status = 'pendente'`,
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
      }

      resultado.forEach(emprestimo => {
        if (emprestimo.foto_capa) {
          emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
        }
      });

      return response.json({ dados: resultado });
    }
  );
}


function show(request, response) {
  const idEmprestimo = request.params.id;

  connection.query(
    `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_emprestimo, e.data_devolucao
     FROM Emprestimos e
     JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
     JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
     JOIN Livro l ON e.fk_id_livros = l.id_livro
     WHERE e.id_emprestimo = ?`,
    [idEmprestimo],
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Erro ao buscar detalhes do empréstimo." });
      }

      if (resultado.length === 0) {
        return response.json({ erro: "Empréstimo não encontrado." });
      }

      let emprestimo = resultado[0];
      if (emprestimo.foto_capa) {
        emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
      }

      return response.json({ dados: emprestimo });
    }
  );
}

function reservar(request, response) {
  const livroId = request.params.id;
  const usuarioId = request.body.usuarioId;

  connection.query(
    "SELECT quantidade_estoque FROM Estoque WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
    [livroId],
    function (err, resultado) {
      if (err || resultado.length === 0 || resultado[0].quantidade_estoque <= 0) {
        return response.json({ erro: "Erro ao reservar livro ou livro indisponível." });
      }

      // Diminui o estoque em 1
      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque - 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [livroId],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar o estoque." });
          }

          // Insere a reserva com status "pendente"
          connection.query(
            "INSERT INTO Emprestimos (fk_id_livros, data_emprestimo, data_prevista_devolucao, status) VALUES (?, NULL, NULL, 'pendente')",
            [livroId],
            function (err, emprestimoResult) {
              if (err) {
                return response.json({ erro: "Erro ao registrar a reserva." });
              }

              const emprestimoId = emprestimoResult.insertId;

              // Associa o usuário à reserva
              connection.query(
                "INSERT INTO Usuario_Emprestimos (fk_id_usuario, fk_id_emprestimo) VALUES (?, ?)",
                [usuarioId, emprestimoId],
                function (err) {
                  if (err) {
                    return response.json({ erro: "Erro ao associar usuário ao empréstimo." });
                  }
                  return response.json({ mensagem: "Reserva solicitada com sucesso." });
                }
              );
            }
          );
        }
      );
    }
  );
}

function aprovarReserva(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date();
  const dataPrevistaDevolucao = new Date(dataAtual);
  dataPrevistaDevolucao.setDate(dataAtual.getDate() + 30);

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Reserva não encontrada ou já aprovada." });
      }

      // Atualiza o empréstimo para "aprovado" e define as datas
      connection.query(
        "UPDATE Emprestimos SET status = 'aprovado', data_emprestimo = ?, data_prevista_devolucao = ? WHERE id_emprestimo = ?",
        [dataAtual, dataPrevistaDevolucao, idEmprestimo],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao aprovar a reserva." });
          }
          return response.json({ mensagem: "Reserva aprovada com sucesso." });
        }
      );
    }
  );
}

function rejeitarReserva(request, response) {
  const idEmprestimo = request.params.id;

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Reserva não encontrada ou já processada." });
      }

      const livroId = resultado[0].fk_id_livros;

      // Aumenta o estoque em 1 para desfazer a reserva
      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [livroId],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar o estoque." });
          }

          // Atualiza o empréstimo para "rejeitado"
          connection.query(
            "UPDATE Emprestimos SET status = 'rejeitado' WHERE id_emprestimo = ?",
            [idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao rejeitar a reserva." });
              }
              return response.json({ mensagem: "Reserva rejeitada e estoque atualizado." });
            }
          );
        }
      );
    }
  );
}

function devolver(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date();

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ?",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Erro ao obter o livro do empréstimo ou empréstimo não encontrado." });
      }

      const idLivro = resultado[0].fk_id_livros;

      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [idLivro],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
          }

          connection.query(
            "UPDATE Emprestimos SET data_devolucao = ?, status = 'concluido' WHERE id_emprestimo = ?",
            [dataAtual, idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao atualizar a data de devolução." });
              }

              connection.query(
                "INSERT INTO Historico (data_historico, fk_id_livros, fk_id_emprestimo) VALUES (?, ?, ?)",
                [dataAtual, idLivro, idEmprestimo],
                function (err) {
                  if (err) {
                    return response.json({ erro: "Erro ao registrar o histórico de devolução." });
                  }
                  return response.json({ mensagem: "Livro devolvido com sucesso." });
                }
              );
            }
          );
        }
      );
    }
  );
}



module.exports = { list, show, reservar, devolver, aprovarReserva, rejeitarReserva, emprestimoAprovar };
