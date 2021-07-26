var express = require('express');
var router = express.Router();

require('dotenv').config()
var bcrypt = require('bcrypt');
var mongoose = require('mongoose')

const nodemailer = require("nodemailer");
let urlExists = require('url-exists')

var jwt = require('jsonwebtoken')
var { nanoid } = require("nanoid");
var ids = nanoid(5);

var { userval } = require("../models/userstructure")
var { shoridurl } = require("../models/shortid")

let uri = process.env.URL
let jwtsecret = process.env.JWT


let sendmail = async (a) => {

  try {

    let transporter = nodemailer.createTransport({

      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
      },
    });


    if (a.id) {

      const mailData = {
        from: "yourdetail90@gmail.com",
        subject: "Reset you account by clicking on the link",
        to: a.email,
        html: `<a href="https://minifylongurl.herokuapp.com/users/resetreq/${a.id}" target="_blank">click to reset<a>`
      }


      transporter.sendMail(mailData)
    }
    else {

      const mailoptions = {
        from: process.env.MAIL,
        to: a,
        subject: "hii hello and we are glad you are here",
        text: "Greetings click on the link to activate your account",
        html: `<a href="https://minifylongurl.herokuapp.com/users/activate/${a}" target="_blank">click to activate<a>`
      }


      const mailtoadmin = {
        from: process.env.MAIL,
        to: process.env.MAIL,
        subject: "new user have registered",
        text: `${a} has registered`
      }

      const result = await transporter.sendMail(mailoptions)


      const alertnotify = await transporter.sendMail(mailtoadmin)


      return result, alertnotify
    }


  } catch (err) {
    
   let error=err;
  }




}

/* GET users listing. */
router.get('/', async function (req, res, next) {
  res.send('respond with a resource');
});




router.post('/reg', async function (req, res) {

  try {
    await mongoose.connect(uri, { useNewUrlParser: true }, { useUnifiedTopology: true });
    const salt = bcrypt.genSaltSync(10);

    let hash = await bcrypt.hash(req.body.password, salt)

    req.body.password = hash;
    await mongoose.connect(uri, { useNewUrlParser: true }, { useUnifiedTopology: true });
    let value = new userval({
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    })

    await value.save()

   

    await mongoose.disconnect()


    sendmail(req.body.email)
     
    res.status(200).json({ "mess": "welcome", value })
  }
  catch (err) {
    res.status(400).send({ err })

  }


})


router.get('/activate/:usermail', async function (req, res) {

  try {
    await mongoose.connect(uri, { useNewUrlParser: true }, { useUnifiedTopology: true });

  

    let doc = await userval.findOneAndUpdate({ email: req.params.usermail }, {
      $set: { activated: true }
    });

    await mongoose.disconnect()


    res.redirect("https://minfyurl.netlify.app/login")
  }
  catch (err) {
   
    res.status(400).send({ err })
  }

});



router.post("/login", async (req, res) => {
  try {
    

    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });


    let user = await userval.findOne({ email: req.body.email })
   

    if (user.activated) {

      if (user) {

        let comp = await bcrypt.compare(req.body.password, user.password);

        if (comp) {

          let token = jwt.sign({ userid: user._id }, jwtsecret, { expiresIn: '1h' })


          res.json({ token: token })


          await mongoose.disconnect()


        }
        else {
          res.status(404).json({ "err": "invalid credentials" })
        }

      }
      else {
        res.status(404).json({ "err": "invalid credentials" })


      }
    }
    else {
      res.status(404).json({ "err": "activate your account through email" })
    }

  }
  catch (err) {
    res.status(404).json({ err })


  }

})



router.post("/reset", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    let user = await userval.findOne({ email: { $eq: req.body.email } })
    if (user) {

      let identity = {};
      identity.id = ids;
      identity.email = req.body.email;

      await userval.findOneAndUpdate({ email: req.body.email }, { $set: { resetid: ids } })


      sendmail(identity)


      await mongoose.disconnect();

      res.json({ "mess": "reset ready" })
    }
    else {
      res.status(404).json({ "err": "user not found" })
    }

  } catch (err) {

    res.status(400).json({ err })

  }
})

router.get("/resetreq/:randstr", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    let user = await userval.findOne({ resetid: { $eq: req.params.randstr } })

    if (user) {
      res.redirect("https://minfyurl.netlify.app//resetpassword")

      await mongoose.disconnect()

    }
  
  }
  catch (err) {
    res.json({ "err": "invalid credentials" })

  }

})

router.post("/resetpassword", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    let user = await userval.findOne({ email: { $eq: req.body.email } })

    if (user) {

      const salt = bcrypt.genSaltSync(10);

      let hash = await bcrypt.hash(req.body.password, salt)

      let doc = await userval.updateOne({ _id: user._id }, {
        $set: { password: hash, resetid: "" }
      });

      await mongoose.disconnect()

      res.json({ "mess": "password is reset" })

    }
    

  }
  catch (err) {
    res.json({ "err": "invalid credentials" })

  }

})



function authenticate(req, res, next) {
 
  try {
    if (req.headers.authorization) {

      jwt.verify(req.headers.authorization, jwtsecret, function (err, data) {
        if (err) {
         res.status(400).json({err})
        }
        if (data) {
          next();
        }
      }
      );


    }
    else {
      res.json({ "mess": "invalid creditials" })
    }
  }
  catch (err) {
    res.status(400).json({err})

  }
}



router.get("/mainurlpage", authenticate, (req, res) => {



  //send islogged in true so it will make changes to see shortner app
  
  res.status(200).json({ "message": "user logged in" })

})



//shortner api



//all url to be populated
router.get("/data", async (req, res) => {


  try {
    await mongoose.connect(uri, { useNewUrlParser: true });

    let alldata = await shoridurl.find(function (err, data) {
      if (err) {
        res.status(400).json({err})
      }
      res.status(200).json({ "initial": data });
    })
  }
  catch (err) {
        res.status(400).json({err})
        
  }
  finally {
    mongoose.disconnect()


  }

})

//send long url to get short one
router.post("/long", async (req, res) => {

  try {
    urlExists(req.body.longurl, async function (err, exists) {
      if (!exists || err) {
        
        res.status(400).json({ "err": "try with correct url" })
      }
      else if (exists) {
       
        await mongoose.connect(uri, { useNewUrlParser: true });

        var ID = nanoid(5);

        let generator = new shoridurl({
          longurl: req.body.longurl,
          shorturl: ID
        })


        
        await generator.save()
        let alldata = await shoridurl.find(function (err, data) {
          if (err) throw err
          res.status(200).json({ "initial": data });
        })



      }

    }
    )
  }
  catch (err) {
    res.status(400).json({err})

  }
  finally {
    mongoose.disconnect()

  }

})




router.get("/delete/:shortner", async function (req, res) {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true });
   
    await shoridurl.findOneAndDelete({ shorturl: req.params.shortner }, async function (err, docs) {
      if (err) {
        res.status(400).json({err})

      }
      else {

        res.json({ "data": "deleted" })
      }


    });

  }
  catch {
    res.status(400).json({err})

  }
  finally {
    mongoose.disconnect();
  }



})


router.get("/redirect/:shortner", async function (req, res) {

  try {
    await mongoose.connect(uri, { useNewUrlParser: true });
    await shoridurl.findOne({ shorturl: req.params.shortner }, async function (err, docs) {
      if (err) {
        res.status(400).json({err})

      }
      else {
       

        shoridurl.updateOne({ shorturl: req.params.shortner },
          { "$inc": { count: 1 } }, function (err, docs) {
            if (err) {
              res.status(400).json({err})

            }
          });

       


        await res.redirect(docs.longurl);
      }
    });

  }
  catch {
    res.status(400).json({err})

  }
  finally {
    mongoose.disconnect();
  }


})


module.exports = router;
