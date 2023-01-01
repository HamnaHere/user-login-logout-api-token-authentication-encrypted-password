const express = require("express");
const errorHandler = require("../../middleware/error");
const User = require("../../models/user");
const { generateAuthToken, generateHash, compareHash } = require("../../utils/helpers");
const createUserSchema = require("./validationSchema");
const authHandler = require("../../middleware/auth");
const router = express.Router();
 require("../../utils/helpers");

//get all users
router.get(
  "/",
  errorHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).send(users);
  })
);
//Veiw profile of a specific user
router.get(
  "/:userId/viewprofile", authHandler,
  errorHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.userId });

    res.status(200).send(user);
  })
);
//login a user
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send({ message: "Invalid Email or Password" });
  }
  const isPasswordValid = compareHash(req.body.password, user.password)

  if (!isPasswordValid) {
    return res.status(400).send({ message: "Invalid Email or Password" });
  }

  const token = generateAuthToken({
    username: user.username,
    email: user.email
  });
  // user.token = token;
  await User.findOneAndUpdate({ _id: user._id}, {token : token})
  console.log("this is your tokens",token)

  res.status(200).send({ message: "success", token, user });
 
});
//sign up
router.post("/signup", async (req, res) => {
  const payload = req.body;
  const { error } = createUserSchema(payload);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }
  payload.password = generateHash(payload.password);
  console.log(payload)
  let user = new User(payload);
  user = await user.save();
  res.status(200).send({ user });
});
//edit profile of a user
router.put("/:userId/editprofile",authHandler,async (req,res)=>{

  console.log ('body', req.body ,req.params.userId)

    try {
        const user = await User.findOneAndUpdate({_id: req.params.userId}, req.body);
        console.log('json',user)
        res.json({ data: user, status: "success" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
//delete a user
router.delete("/:userId/deleteuser",authHandler,async (req,res)=>{

  try {
      const user = await User.findByIdAndDelete(req.params.userId);
      res.json({ data: user, status: "success" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

//logout
router.get(
  "/logout",
  authHandler,
  errorHandler(async (req, res) => {
    const user = await User.findOne({ token: req.headers.token });
    await User.findOneAndUpdate({ _id: user._id }, { token: "" });
    res.status(200).send({
      status: true,
      message: "Logout successfully",
    });
  })
);


module.exports = router;
