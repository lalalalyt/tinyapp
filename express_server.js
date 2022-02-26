const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
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
  if (req.cookies.user_id) {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id],
  };
  // console.log(req.cookies)
  // console.log(templateVars.user)
  res.render("urls_index", templateVars);
}
else {
  res.status(403).send("Please log in")
}
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id && req.cookies.user_id===urlDatabase[req.params.shortURL].userID ){
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id],
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
  if (req.cookies.user_id) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.cookies.user_id;
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
  if (req.cookies.user_id && req.cookies.user_id===urlDatabase[req.params.shortURL].userID){
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
  }
  else if (!req.cookies.user_id) {
    res.status(403).send("Please log in!")
  }
  else if (!urlDatabase[req.params.shortURL]){
    res.status(403).send("This shortURL does not exist.")
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id && req.cookies.user_id===urlDatabase[req.params.shortURL].userID){
  newURL = req.body.longURL;
  shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
  }
  else if (!req.cookies.user_id) {
    res.status(403).send("Please log in!")
  }
  else if (!urlDatabase[req.params.shortURL]){
    res.status(403).send("This shortURL does not exist.")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (Object.keys(req.cookies).length) {
    res.redirect("/urls");
  }
  res.render("account_register");
});

const users = {
  sdf12f: {
    id: "sdf12f",
    email: "bighead@gmail.com",
    password: "123",
  },
  ad129d: {
    id: "ad129d",
    email: "bigburger@gmail.com",
    password: "2345",
  },
};

const emailLookup = (email) => {
  for (let user in users) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Please enter valid email address and password!");
    return;
  }
  // console.log(users)
  // console.log(emailLookup(email))
  if (emailLookup(email)) {
    res.status(400).send("This account already exists.");
    return;
  }

  const user = { id, email, password };
  users[id] = user;
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (Object.keys(req.cookies).length) {
    res.redirect("/urls");
  }
  res.render("account_login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!emailLookup(email)) {
    res.status(403).send("This account does not exist");
    return;
  }
  if (emailLookup(email)) {
    if (password !== users[emailLookup(email)].password) {
      res.status(403).send("Wrong Password");
    }
    res.cookie("user_id", emailLookup(email));
  }
  res.redirect("/urls");
});
