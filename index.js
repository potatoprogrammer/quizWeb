// 1. Import express and axios
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import he from "he";
// 2. Create an express app and set the port number.
const app = express();
const port = 3000;
const token = "";

var correctAnswer = "";
var lives = 3;
var difficulty = "";
var categoryid = "";
var questions = {};
var score = 0;

// 3. Use the public folder for static files.
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

function decodeEntities (s) {
    return s.replace(/&[a-z0-9]+;/gi, function (entity) {
        return he.decode(entity);
    });
    }

function getAnswers(result){
    var answers = [result.data.results[0].correct_answer, result.data.results[0].incorrect_answers[0], result.data.results[0].incorrect_answers[1], result.data.results[0].incorrect_answers[2]];
        answers.sort(function(a, b) {
            return Math.random() - 0.5; // a random number between -0.5 and 0.5
        });
        correctAnswer = result.data.results[0].correct_answer;
        correctAnswer = decodeEntities(correctAnswer);
        correctAnswer = correctAnswer.replace(/&#039;/g, "'");
        return answers;
}

function capitalize(word) {
    return word[0].toUpperCase() + word.slice(1);
}

app.get("/home", async (req, res) => {
    //retrieves the list of categories
    try{        
        const result = await axios.get("https://opentdb.com/api_category.php");
        res.render("home.ejs", {categories: result.data.trivia_categories, score: String(score)});
    } catch(error){
        console.log(error);
        res.status(500);
    }    
});

app.post("/home", async (req, res) => {
    try{        
        const result = await axios.get("https://opentdb.com/api_category.php");
        res.render("home.ejs", {categories: result.data.trivia_categories});
    } catch(error){
        console.log(error);
        res.status(500);
    }    
});

// 4. When the user goes to the home page it should render the index.ejs file.
app.get("/", async (req, res) => {
    if (token === ""){
        try{            
            res.redirect("/home");
        } catch(error){
            console.log(error);
            res.status(500);
        }
    }
});  

app.post("/question", async (req, res) => {
    try {
        if (difficulty == "" && categoryid == ""){
            difficulty = req.body.difficulty;
            categoryid = req.body.id;
        }        

        const result = await axios.get("https://opentdb.com/api.php?amount=10&category="+ req.body.id + "&difficulty=" + req.body.difficulty+ "&type=multiple");

        questions = {...result};

        if (result.data.results == ""){
           console.log("Sorry, we got some issue on our end, please return to the home screen.");
        }
        var answers = getAnswers(result);
        res.render("index.ejs", { question: result.data.results[0].question, 
                                  options: answers, 
                                  showquestion: true, 
                                  lives: lives, 
                                  score: String(score), 
                                  difficulty: capitalize(difficulty) });
    } catch (error) {
        console.log(error);
        console.log("erro question");
        res.status(500);
    }
});  

app.get("/newquestion", async (req, res) => {
    try {
        if (questions.data.results.length <= 1){
            const result = await axios.get("https://opentdb.com/api.php?amount=10&category="+ categoryid + "&difficulty=" + difficulty+ "&type=multiple");
            questions = {...result};
        }else {
            questions.data.results.splice(0,1);
        }

        var answers = getAnswers(questions);        
        res.render("index.ejs", { question: questions.data.results[0].question,
                                  options: answers, 
                                  showquestion: true, 
                                  lives: lives, 
                                  score: String(score), 
                                  difficulty: capitalize(difficulty) });
    } catch (error) {
        console.log(error);
        console.log("erro teste");
        res.status(500);
    }
});  

app.post("/result", (req, res) => {
    if (correctAnswer === String(req.body.selected)){
        score += 1;
        res.redirect("/newquestion");
    } else {
        lives = lives - 1;


        if (lives >= 1 ){       
            res.redirect("/newquestion");     
        } else if (lives <= 0){
            var endgame = true;
            lives = 3;
            score = 0;
            res.render("index.ejs", { content: "Sorry you are out of lives, but you can start a new game.", goHome: endgame, difficulty: capitalize(difficulty) });
        }
    }
});

// 5. Listen on your predefined port and start the server.
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });