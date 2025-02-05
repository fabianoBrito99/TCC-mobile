const express = require("express");
const multer = require("multer");
const livrosController = require("../controllers/livros.controllers")


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotas para livros
router.get("/livro/:codigo", livrosController.show);
router.get("/livro", livrosController.list);
router.post("/livro", upload.single("foto_capa"), livrosController.create);

<<<<<<< HEAD



=======
// Rotas para categorias
router.get("/categorias", livrosController.listaCategorias);
router.post("/livro/:livroId/categoria", livrosController.addCategoria);

// Rotas para autores
router.get("/livro/:livroId/autores", livrosController.ListaAutorLivro);
>>>>>>> 102d2bce8294e42845763971409208cf5b3cd454

module.exports = router;
