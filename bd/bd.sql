CREATE DATABASE IF NOT EXISTS bibliotecaMobile;
USE bibliotecaMobile;
drop DATABASE  bibliotecaMobile;

-- Tabela usuario
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome_usuario VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(15) NULL,
  cep VARCHAR(15) NULL,
  rua VARCHAR(100) NULL,
  bairro VARCHAR(100) NULL,
  numero VARCHAR(10) NULL
);

-- Tabela livro
CREATE TABLE IF NOT EXISTS livro (
  id_livro INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome_livro VARCHAR(100) NOT NULL,
  quantidade_paginas INT NULL,
  descricao TEXT NULL,
  foto_capa MEDIUMBLOB,
  ano_publicacao YEAR NULL
);

-- Tabela categoria
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome_categoria VARCHAR(100) NOT NULL
);

-- Tabela autor
CREATE TABLE IF NOT EXISTS autor (
  id_autor INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(45) NOT NULL
);

-- Tabela estoque
CREATE TABLE IF NOT EXISTS estoque (
  id_estoque INT PRIMARY KEY AUTO_INCREMENT,
  quantidade_estoque INT NOT NULL,
  fk_id_livro INT NOT NULL,  -- Adiciona a chave estrangeira
  FOREIGN KEY (fk_id_livro) REFERENCES livro(id_livro) ON DELETE CASCADE
);


-- Tabela emprestimos
CREATE TABLE IF NOT EXISTS emprestimos (
  id_emprestimo INT PRIMARY KEY AUTO_INCREMENT,
  data_emprestimo DATE NOT NULL,
  data_prevista_devolucao DATE NOT NULL,
  data_devolucao DATE NULL,
  fk_id_livro INT NOT NULL,
  FOREIGN KEY (fk_id_livro) REFERENCES livro(id_livro) ON DELETE CASCADE
);

-- Tabela Usuario_Emprestimos (Relacionamento entre Usuario e Emprestimos)
CREATE TABLE IF NOT EXISTS usuario_emprestimos (
  fk_id_usuario INT NOT NULL,
  fk_id_emprestimo INT NOT NULL,
  PRIMARY KEY (fk_id_usuario, fk_id_emprestimo),
  FOREIGN KEY (fk_id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (fk_id_emprestimo) REFERENCES emprestimos(id_emprestimo) ON DELETE CASCADE
);

-- Tabela Livro_Categoria (Relacionamento entre Livro e Categoria)
CREATE TABLE IF NOT EXISTS livro_categoria (
  id_livro_categoria INT PRIMARY KEY AUTO_INCREMENT,
  fk_id_livros INT NOT NULL,
  fk_id_categoria INT NOT NULL,
  FOREIGN KEY (fk_id_livros) REFERENCES livro(id_livro) ON DELETE CASCADE,
  FOREIGN KEY (fk_id_categoria) REFERENCES categoria(id_categoria) ON DELETE CASCADE
);


-- Tabela Autor_Livro (Relacionamento entre Autor e Livro)
CREATE TABLE IF NOT EXISTS autor_livro (
  id_autor_livros INT PRIMARY KEY AUTO_INCREMENT,
  fk_id_autor INT NOT NULL,
  fk_id_livro INT NOT NULL,
  FOREIGN KEY (fk_id_autor) REFERENCES autor(id_autor) ON DELETE CASCADE,
  FOREIGN KEY (fk_id_livro) REFERENCES livro(id_livro) ON DELETE CASCADE
);
