const express = require('express');
const router = express.Router();
require('dotenv').config()
const session = require('express-session')
const mysql=require('mysql2/promise')
// const jwt = require('jsonwebtoken')
const bcryptjs = require("bcryptjs")

//MYSQl
const conexion=mysql.createPool({
    database:process.env.DATABASE,
    user:process.env.USER,
    password:process.env.PASSWORD,
    host:process.env.HOST
})
//SESSION
const MySQLStore = require("express-mysql-session")(session);

const options = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  database: "misesion",
};

const sessionStore = new MySQLStore(options);

router.use(session({
	key: 'session_cookie_name',
	secret: 'session_cookie_secret',
	store: sessionStore,
	resave: false,
	saveUninitialized: false
}))

sessionStore.onReady().then(() => {
	// MySQL session store ready for use.
	console.log('MySQLStore ready');
}).catch(error => {
	// Something went wrong.
	console.error(error);
});

//RUTAS
router.get('/', (req, res, next) =>{
  res.render('index', { title: 'Express' });
});
router.get('/register', (req, res, next) =>{
  res.render('register',{ myerror:''})

});
router.get('/login', (req, res, next) =>{
  res.render('login',{myerror:''})
});
router.get('/inicio',(req,res)=>{
  res.render('inicio',{nombre:req.session.username,visitas:req.session.visitas})
})

router.get('/anadir',(req,res)=>{
  res.render('anadir')
})

router.get('/cartelera',async(req,res)=>{
  const [movies]=await conexion.query('SELECT * FROM informacion')
  let user_id=req.session.id
  let movies_filter = movies.filter(m=>m.id_user==user_id)
  res.render('cartelera',{peliculas:movies_filter})
  const [users]=await conexion.query('SELECT * FROM users')
  
})
router.post('/registrarme',async(req,res)=>{
  const [rows]=await conexion.query('SELECT * FROM users')
  console.log(req.body.name)
  console.log(req.body.mail)
  console.log(req.body.password)
  let user=rows.find(e=>e.mail==req.body.mail)
  if (user){
    console.log("Usuario con ese gmail ya existe")
    res.render('register',{myerror: "Gmail ya registrado"})
  }else{
    let mipassHash = await bcryptjs.hash(req.body.password,8)
    await conexion.query('INSERT INTO users (name, mail, password) VALUES (?, ?, ?)', [req.body.name, req.body.mail, mipassHash])
    res.redirect('/login')
  }

})

router.post('/logearme',async(req,res)=>{

  console.log(req.session)

  const [rows]=await conexion.query('SELECT * FROM users')
  let user=rows.find(e=>e.mail==req.body.mail)
  if (user){
    let micompare = await bcryptjs.compare(req.body.password, user.password)
    if (micompare){
      console.log(user)
      console.log("Logeado con éxito")
      req.session.username=user.name
      req.session.id=user.id
      req.session.visitas=req.session.visitas? ++req.session.visitas:1
      res.redirect('/inicio')
    }else{
      console.log("ESA NO ES LA CONTRASEÑA")
      res.render('login',{myerror: "Usuario o contraseña incorrectos"})
    }
  }else{
    console.log("NO SE ENCUENTRA ESE USUARIO")
    res.render('login',{myerror: "Usuario o contraseña incorrectos"})
  }
})

router.post('/anadir',async(req,res)=>{
  const [rows]=await conexion.query('SELECT * FROM users')

  let titulo=req.body.titulo
  let descripcion=req.body.descripcion
  let imagen=req.body.imagen
  let user_id=req.session.id
  console.log(titulo,descripcion,imagen,user_id)
  await conexion.query('INSERT INTO informacion (titulo,descripcion,imagen,id_user) VALUES (?, ?, ?,?)', [titulo,descripcion,imagen,user_id])
  res.redirect('/cartelera')
})

router.post('/cartelera',(req,res)=>{

  res.redirect('/cartelera')

})

router.post('/homeredirect',(req,res)=>{
  res.redirect('/')
})
router.post('/loginredirect',(req,res)=>{
  res.redirect('/login')
})
router.post('/registerredirect',(req,res)=>{
  res.redirect('/register')
})
router.post('/carteleraredirect',(req,res)=>{
  res.redirect('/cartelera')
})

module.exports = router;
