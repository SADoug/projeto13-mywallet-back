import express, { json } from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import cors from "cors";
import chalk from "chalk";
import bcrypt from 'bcrypt';

const app = express();
app.use(json());
app.use(cors());
dotenv.config();

let db = null;
const mongoClient = new MongoClient("mongodb+srv://teste:teste@clusterdoug.oqldb.mongodb.net/ClusterDoug?retryWrites=true&w=majority");
const promise = mongoClient.connect();
promise.then(() => {
  db = mongoClient.db(process.env.BANCO);
  console.log(chalk.yellowBright.bold("Conexão com o banco dados MongoDB estabelecida!"));
});
promise.catch((e) => console.log(chalk.red.bold("Erro ao se conectar ao banco de dados"), e));

app.post("/sign-up", async (req, res) => {
  const cliente = req.body; // {name: "joão"}
  const clienteSchema = joi.object({ 
      name: joi.string().min(1).required(),
      email: joi.string().min(1).required(), //fazer validação com regex
      senha: joi.string().min(8).required(), //fazer validação com regex
});
  const { error } = clienteSchema.validate(cliente); // {value: info, [error]}
  if (error) {
    console.log(error);
    return res.sendStatus(422);
  }
  const senhaHash = bcrypt.hashSync(cliente.senha, 10);
  try {
    const clienteExiste = await db.collection("clientes").findOne({ name: cliente.nome });
    if (clienteExiste) {
      return res.sendStatus(409);
    }
    await db.collection("clientes").insertOne({name: cliente.name, email: cliente.email, senha: senhaHash });
    console.log(chalk.green.bold("Cliente cadastrado no banco de dados"));
    res.sendStatus(201);

  } catch (e) {
    console.log(e);
    return res.status(500).send("Erro ao registrar o usuário!", e);
  }

});

app.post("/sign-in", async (req, res) => {
    const { email, senha } = req.body;
    const user = await db.collection('clientes').findOne({ email });
    console.log(user.senha);
    if(user && bcrypt.compareSync(senha, user.senha)) {
        console.log(chalk.redBright.bold("sucesso, usuário encontrado com este email e senha!"));
    } else {
        console.log(chalk.red.bold("usuário não encontrado (email ou senha incorretos)"));
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(chalk.yellowBright.bold(`O servidor está em pé ${port}`));
});
