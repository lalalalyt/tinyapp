const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')
const {getUserByEmail} = require("./helpers")

app.use(cookieSession({
  name: 'session',
  keys: ["5963fdbb-f785-44f5-9d74-34b735001f7e"]
}))

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "sdf12f",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id],
  };
 
  res.render("urls_index", templateVars);
}
else {
  res.status(403).send("Please log in")
}
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id && req.session.user_id===urlDatabase[req.params.shortURL].userID ){
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
}
else (
  res.status(403).send("Please log in")
)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    res.redirect(`/urls/${shortURL}`);
  }
  res.status(403).send("please log in");
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
  res.status(404).send("Cannot find the website")
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id && req.session.user_id===urlDatabase[req.params.shortURL].userID){
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
  }
  else if (!req.session.user_id) {
    res.status(403).send("Please log in!")
  }
  else if (!urlDatabase[req.params.shortURL]){
    res.status(403).send("This shortURL does not exist.")
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id && req.session.user_id===urlDatabase[req.params.shortURL].userID){
  newURL = req.body.longURL;
  shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
  }
  else if (!req.session.user_id) {
    res.status(403).send("Please log in!")
  }
  else if (!urlDatabase[req.params.shortURL]){
    res.status(403).send("This shortURL does not exist.")
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (Object.keys(req.session).length) {
    res.redirect("/urls");
  }
  res.render("account_register");
});

const users = {
  sdf12f: {
    id: "sdf12f",
    email: "bighead@gmail.com",
    hashedPassword: bcrypt.hashSync("123",10)
  },
  ad129d: {
    id: "ad129d",
    email: "bigburger@gmail.com",
    hashedPassword: bcrypt.hashSync("2345",10)
  },
};



app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10)
  if (!email || !password) {
    res.status(400).send("Please enter valid email address and password!");
    return;
  }

  if (getUserByEmail(email,users)) {
    res.status(400).send("This account already exists.");
    return;
  }

  const user = { id, email, hashedPassword};
  users[id] = user;
  // console.log("entered password:", password, "hashed password:", hashedPassword, users)
  req.session.user_id = id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (Object.keys(req.session).length) {
    res.redirect("/urls");
  }
  res.render("account_login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!getUserByEmail(email,users)) {
    res.status(403).send("This account does not exist");
    return;
  }
  if (getUserByEmail(email,users)) {
    if (!bcrypt.compareSync(password, users[getUserByEmail(email, users)].hashedPassword)) {
      res.status(403).send("Wrong Password");
    }
    req.session.user_id= getUserByEmail(email, users);
  }
  res.redirect("/urls");
});
