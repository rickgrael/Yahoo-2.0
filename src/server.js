const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser')
const app = express();

const User = require('./database/models/user')
const Question = require('./database/models/question')
const Answer = require('./database/models/answer')
const Liked_question = require('./database/models/liked_question');
const Liked_answer = require('./database/models/liked_answer');
const User_favorite = require('./database/models/user_favorite')

const authentication = require('./middlewares/authentication');
const { Op } = require('sequelize');
const saltRounds = 10

app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(session({
    secret: 'sdkflds dsf klk',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}))

app.get('/', authentication,async (req, res) => {
    const {userId} = req.session.user
    const questions = await Question.findAll({raw:true});
    await Promise.all(questions.map(async question =>{
        const counter = await Answer.count({where:{questionId:question.id}})
        const user = await User.findOne({where:{id:question.userId}, raw:true})
        const favorite = await User_favorite.findOne({where:{userId, questionId:question.id}})
        if(favorite){
            question.favorite = true
        }else{
            question.favorite = false
        }
        question.counter = counter;
        question.user = user.name;
    }))
    console.log(questions)
    res.render('pages/feed/index', {questions});
})

app.get('/login', (req, res) => {
    res.render('pages/login/index')
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        where: {
            email: email,
        }, raw:true
    })
    if(!user) return res.json({status: 'error', message: 'User not found.'})
    const equals = bcrypt.compareSync(password, user.password)
    console.log(email, password)
    if (equals) {
        req.session.user = {email: user.email, userId: user.id, name: user.name}
        res.json({status: 'success', message: 'Login Successful'})
    } else {
        res.json({status: 'error', message: 'Login Failed'})
    }
})

app.get('/register', (req, res) => {
    res.render('pages/register/index')
})

app.post('/register', async (req, res) => {
    const {name, email, password} = req.body;
    const user = await User.findOne({where: {email}});
    if(user){
        return res.redirect('/register');
    }
    const hash = bcrypt.hashSync(password, saltRounds)
    const response = await User.create({
        name,
        email,
        password:hash
    })
    if(response){
        res.json({status:"success", message:"User created."});
    } else{
        res.json({status:"fail", message:"User was not created."});

    }
})

app.get('/question/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const {userId} = req.session.user;
    const question = await Question.findOne({where:{id}})
    const answers = await Answer.findAll({where:{questionId: id}, raw: true})
    const countAnswers = answers.length
    const answers_users = await Promise.all(answers.map(async answer => {
        const user = await User.findOne({where: {id: answer.userId}, raw: true})
        const likes = await Liked_answer.count({where: {answerId:answer.id, liked: true}})
        const dislikes = await Liked_answer.count({where: {answerId:answer.id, liked: false}})
        answer.user = {name: user.name, email: user.email}
        answer.likes = likes;
        answer.dislikes = dislikes;
        return answer
    }))
    console.log(answers[0])
    res.render('pages/question/index', {question, answers, countAnswers})
})

app.get('/favoritas', authentication,async (req, res) => {
    const {userId} = req.session.user;
    
    const user_favorites = await User_favorite.findAll({where:{userId}, raw:true})
    const ids = user_favorites.map(p => p.questionId);
    console.log(ids)
    const questions = await Question.findAll({
        where:{ 
            id:{
                [Op.in]:ids
            }
            },raw:true
    });
   console.log(questions)
    await Promise.all(questions.map(async question =>{
        const counter = await Answer.count({where:{questionId:question.id}})
        const user = await User.findOne({where:{id:question.userId}, raw:true})
        const favorite = await User_favorite.findOne({where:{userId, questionId:question.id}})
        if(favorite){
            question.favorite = true
        }else{
            question.favorite = false
        }
        question.counter = counter;
        question.user = user.name;
    }))
    res.render('pages/favoritas/index', {questions})
})

app.get('/minhas_perguntas',authentication, async (req, res) => {
    const {userId, email, name} = req.session.user;
    const questions = await Question.findAll({where:{userId}, raw: true})
    await Promise.all(questions.map(async question =>{
        const counter = await Answer.count({where:{questionId:question.id}})
        question.counter = counter;
    }))
    console.log(questions)
    res.render('pages/minhas_perguntas/index', {
        questions, userName:name
    })
})

//NOVA ROTA
app.get('/minhas_respostas',authentication, async (req, res) => {
    const {userId, name} = req.session.user;
    const answers = await Answer.findAll({
        where: {
            userId
        }, raw: true
    })
    await Promise.all(answers.map(async answer => {
        const question = await Question.findOne({where: {id: answer.questionId}, raw:true})
        const counter = await Answer.count({where:{questionId:question.id}})
        const likes = await Liked_answer.count({where: {answerId:answer.id, liked: true}})
        const dislikes = await Liked_answer.count({where: {answerId:answer.id, liked: false}})
        question.counter = counter;
        answer.question = question;
        answer.likes = likes;
        answer.dislikes = dislikes;
        answer.name = name
    }))
    console.log(answers)
    res.render('pages/minhas_respostas/index', {question_answers: answers});
})

app.get('/nova_pergunta', authentication, (req, res) => {
    res.render('pages/nova_pergunta/index');
})

app.post('/nova_pergunta', authentication, async (req, res) => {
    const {title, description} = req.body;
    const userId = req.session.user.userId;
    console.log(title, description)
    const question = await Question.create({
        title,
        description,
        userId,
        votes: 0
    })
    res.redirect('/question/'+ question.id)
})

app.post('/question/responder/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const {userId} = req.session.user;
    const {description} = req.body;
    if(description == null){
        return res.json({status: 'failed', description: 'description cannot be null.'})
    }
    console.log(id, userId, description)
    const answer = await Answer.create({
        description,
        userId,
        questionId: id,
        votes: 0
    })
    return res.json({status:'success', description:'question created.'})
})

////////////////////////NOVA ROTA//////////////////////
app.post('/vote/question/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const {liked} = req.body;
    const {userId} = req.session.user;
    const question = await Question.findOne({where: {id}});
    if(question.userId === userId){
        return res.json({status: 'error', message: 'You cannot vote for your own question'})
    }
    const voted = await Liked_question.findOne({where: {questionId: id, userId}});
    if(voted){
        if(voted.liked != liked){
            await Liked_question.update({liked: liked}, {where:{questionId: id, userId}})
        } else{
            return res.json({status: 'error', message: 'You have already voted for this question'})
        }
    }
    await Liked_question.create({
        userId,
        questionId: id,
        liked: liked    
    })
    res.json({status: 'success', message: 'Voted'})
})

////////////////////////NOVA ROTA//////////////////////
app.post('/vote/answer/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const {liked} = req.body;
    const {userId} = req.session.user;
    const voted = await Liked_answer.findOne({where: {answerId: id, userId}});
    if(voted){
        if(voted.liked != liked){
            await Liked_answer.update({liked: liked}, {where:{answerId: id, userId}})
        } else{
            return res.json({status: 'error', message: 'You have already voted for this answer'})
        }
    } else{
        await Liked_answer.create({
            userId,
            answerId: id,
            liked: liked
            })
    }
    res.json({status: 'success', message: 'Voted'})
})

////////////////////////NOVA ROTA//////////////////////
app.get('/count_likes/answer/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const likes = await Liked_answer.count({where: {answerId: id, liked: true}});
    res.json({likes})
})

////////////////////////NOVA ROTA//////////////////////
app.get('/count_dislikes/answer/:id', authentication, async (req, res) => {
    const {id} = req.params;
    const dislikes = await Liked_answer.count({where: {answerId: id, liked: false}});
    res.json({dislikes})
})

app.post('/question/favorite/:id', authentication, async(req,res)=>{
    const {userId} = req.session.user;
    const {id} = req.params;
    
    const question = await User_favorite.findOne({where:{questionId:id, userId}});
    if(question){
        User_favorite.destroy(
            {where:{
                userId,
                questionId:id}
            })
        return res.json({status:'success', message:"question was removed from favorites"})
    }
    await User_favorite.create({
        userId,
        questionId:id
    })

    return res.json({status:'success', message:'Question was added in favorites'})
})

app.get('/logoff', authentication, async (req,res) => {
    req.session.destroy()
    res.redirect('/login')
})

app.listen(3000, () => {
    console.log('Servidor está rodando na porta 3000');
});