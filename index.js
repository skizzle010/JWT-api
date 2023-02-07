const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

const users = [
  {
    id: "1",
    username: "utkarsh",
    password: "utkarsh@74",
    isAdmin: true,
  },
  {
    id: "2",
    username: "aditansh",
    password: "aditansh@07",
    isAdmin: false,
  },
];

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
  //take the refresh token from the user
  const refreshToken = req.body.token;
  //send error if there is no token or it's invalid
  if (!refreshToken) {
    return res.status(401).json("You are not authenticated");
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("refresh Token is not valid");
  }

  jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  //if everything is ok, create new access token, refresh token
});

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "30s",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey");
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => {
    return u.username == username && u.password == password;
  });
  if (user) {
    //Generate an access token
    const accessToken = generateAccessToken(user);
    //Generate an refresh token
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken
    });
  } else {
    res.status(400).json("Username or password incorrect!");
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "mySecretKey", (err, user) => {
      if (err) {
        return res.status(403).json("The Token is not valid");
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated");
  }
};

app.delete("/api/users/:userId", verify, (req, res) => {
  console.log(req.user.id);
  console.log(req.params.userId);
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User has been deleted");
  } else {
    res.status(403).json("You're not allowed to delete this user");
  }
});

app.post("/api/logout",verify,(req,res)=>{
    const refreshToken = req.body.token;
    refreshTokens=refreshTokens.filter(token =>token!==refreshToken)
    res.status(200).json("You logged out succesfully")
})

app.listen(4000, () => {
  console.log("server running on port 4000");
});
