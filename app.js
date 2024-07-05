const express = require("express")
const app = express()
const path = require("path")
const userModel = require("./models/user")
const postModel = require("./models/post")
const questionModel = require("./models/questionSchema")
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const upload = require("./config/multerconfig")

app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
app.use(cookieParser())

function isLoggedIn(req, res, next) {
    if (req.cookies.token === '') res.send("Login to your profile first")
    else {
        let data = jwt.verify(req.cookies.token, "seckey")
        req.user = data
        next()
    }
}

app.get("/", (req, res) => {
    res.render("signup")
})

app.post("/register", async (req, res) => {
    let { username, name, age, email, password } = req.body
    let user = await userModel.findOne({ email })
    if (user) return res.status(500).send("User already exists")
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let newUser = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            })
            let token = jwt.sign({ email: email, userid: newUser.id }, "seckey")
            res.cookie("token", token)
            res.redirect("home")
        })
    })
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/login", async (req, res) => {
    let { email, password } = req.body
    let user = await userModel.findOne({ email })
    if (!user) return res.status(500).send("Invalid Credentials")
    bcrypt.compare(password, user.password, (err, result) => {
        if (!result) res.redirect("/login")
        else {
            let token = jwt.sign({ email: email, userid: user.id }, "seckey")
            res.cookie("token", token)
            res.status(200).redirect("/home")
        }
    })
})

app.get("/home", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    await user.save()
    res.render("home")
})

app.get("/takequiz", async (req, res) => {
    res.render("takequiz")
})

app.get("/result", async (req, res) => {
    res.render("result")
})

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts")
    res.render("profile", { user })
})

app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email })
    let { content } = req.body
    let post = await postModel.create({
        user: user._id,
        content
    })
    user.posts.push(post._id)
    await user.save()
    res.redirect("/profile")
})

app.get("/profile/upload", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    res.render("profileupload", {user})
})

app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email })
    user.profilepic = req.file.filename
    await user.save()
    res.redirect("/home")
})

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid)
    }
    else {
        post.likes.splice(post.likes.indexOf(post.user.userid), 1)
    }
    await post.save()
    res.redirect("/profile")
})

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    res.render("edit", { post })
})

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content })
    res.redirect("/profile")
})

app.post("/delete/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndDelete({ _id: req.params.id })
    console.log(post);
    res.redirect("/profile")
})

app.get("/logout", (req, res) => {
    res.cookie("token", "")
    res.redirect("/login")
})

app.get('/get-question', async (req, res) => {
    const questions = await questionModel.find({})
    res.send(questions)
    // res.render('add-question'); // Create add-question.ejs in your views folder
});

app.get("/create_quiz", async (req, res) => {
    res.render("create_quiz")
})

app.post('/add-question', (req, res) => {
    const { questionText, options, isCorrect } = req.body;
    // console.log(questionText);
    // console.log(options);
    // console.log(isCorrect);
    const formattedOptions = options.map((option, index) => ({
      text: option.text,
      isCorrect: parseInt(isCorrect) === index
    }));
  
    const newQuestion = new questionModel({
      questionText,
      options: formattedOptions
    });
    console.log(formattedOptions);
    newQuestion.save()
      .then(() => res.render('home'))
      .catch(err => res.status(500).send(err));
      
    // res.end()
  });
  


app.listen(3000)