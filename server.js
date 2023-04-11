require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const db = require('./db');
const multer = require('multer'); 
// const cryptoJS = require("crypto-js"); 
const Cryptr = require('cryptr');
 
const app = express();

//middlewares 
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const cryptr = new Cryptr('myTotalySecretKey');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });

var uploadMultiple = upload.fields([{ name: 'passportSizePhoto', maxCount: 1 }, { name: 'Signature', maxCount: 1 }]);

//-------------------------------------------functions-------------------------------------
function getDate() {
  let current = new Date();
  let cDate = (current.getMonth() + 1) + '/' + current.getDate() + '/' + current.getFullYear();
  let cTime = current.getHours() + ":" + current.getMinutes();
  let dateTime = cDate + '  ' + cTime;
  return dateTime;
}
function getOnlyDate() {
  let current = new Date();
  let cDate = (current.getMonth() + 1) + '/' + current.getDate() + '/' + current.getFullYear();
  return cDate;
}
function getDateAfter(duration) {
  let current = new Date();
  let month, year;
  month = current.getMonth() + 1 + duration;
  year = current.getFullYear();
  if (month > 12) {
    year = year + Math.floor(month / 12);
    month = month % 12;
  }
  let cDate = month + '/' + current.getDate() + '/' + year;
  return cDate;
}
function DaysBitweentwoDays(d1, d2) {
  var date1, date2;
  date1 = new Date(d1);
  date2 = new Date(d2);
  var time_difference = date2.getTime() - date1.getTime();
  var days_difference = time_difference / (1000 * 60 * 60 * 24);
  return (days_difference)
}
function dayNumber(d) {
  date1 = new Date("1/1/1970");
  date2 = new Date(d);
  var time_difference = date2.getTime() - date1.getTime();
  var days_difference = time_difference / (1000 * 60 * 60 * 24);
  return (days_difference);
}
function IntarestWithPeriod(p, r, t) {
  let RbyN = (r / 12) + 1;
  let TintoN = t * 12;
  let powerget = (RbyN ** TintoN)
  let TotalAmountWithIntarest = Math.floor(p * powerget);
  return TotalAmountWithIntarest;
}

//Daily Update
function FixedDipositUpdate() {
  db.getAllcustomersWithFD()
    .then((docs) => {
      docs.forEach((doc) => {
        let accountNo = doc.AccountNo;
        doc.fixedDipositEntery.forEach((fixded) => {
          if (fixded.maturitiyDate === getOnlyDate()) {
            let FixID = fixded._id;
          db.getCustomer( accountNo )  
           .then((usertk) =>{
            db.updateCurentTotalAmount(accountNo, parseInt(usertk.currentTotalAmount) + parseInt(fixded.finalAmount) )
              .then((posts) => {
                let day = getOnlyDate();
                let dayNumberk = dayNumber(day);
                db.TransactionDeatailsSave(accountNo, "Unlock The Fixed Amount", parseInt(fixded.finalAmount), parseInt(usertk.currentTotalAmount) + parseInt(fixded.finalAmount), getDate(), "auto", "Deposit", dayNumberk, fixded.BankerId)
                  .then((foundCustomer) => {
                    db.delateFDSubdoc(accountNo, FixID)
                      .then((post) => {
                        db.getCustomer( accountNo )
                        .then((usertkk) =>{
                          if (!usertkk.fixedDipositEntery[0]) {
                            db.updateAnyfixedIsHere(accountNo)
                              .then((posts) => {
                                console.log("any fixed diposit not exist");
                              })
                              .catch((err) => {
                                console.log(err);
                                assert.isNotOk(err,'Promise error');
                                done();
                              })
                          }
                          console.log("sucessfully update");
                        })
                        .catch((err)=>{
                          console.log(err);
                          assert.isNotOk(err,'Promise error');
                          done();
                        })
                      })
                      .catch((err) => {
                        console.log(err);
                        assert.isNotOk(err,'Promise error');
                        done();
                      })
                  })
                  .catch((err) => {
                    console.log(err);
                    assert.isNotOk(err,'Promise error');
                    done();
                  })
              })
              .catch((err) => {
                console.log(err);
                assert.isNotOk(err,'Promise error');
                done();
              })
            })
            .catch((err)=>{
              console.log(err);
              assert.isNotOk(err,'Promise error');
              done();
            })
          }
        })
      })
    })
    .catch((err) => {
      console.log(err);
      assert.isNotOk(err,'Promise error');
      done();
    })
}


//emi auto update
function EMIPaymentUpdate() {
  db.getAllcustomersWithEMI()
    .then((docs) => {
      docs.forEach((doc) => {
        let accountNo = doc.AccountNo;
        let crAmount = doc.currentTotalAmount;
        let loanEMI = doc.loanEMIEntery[0];
        let loanSubDoc = doc.loanAplicationEntery[0];
        if (loanEMI.dateIntarestCalculate === getOnlyDate()) {
          let emiId = loanEMI._id;
          let loanId = loanSubDoc._id;
          currentTotalAmount = parseInt(crAmount) - parseInt(loanEMI.loanEmiAmount);
          db.updateCurentTotalAmount( accountNo, parseInt(crAmount) - parseInt(loanEMI.loanEmiAmount) )
            .then((posts) => {
              let day = getOnlyDate();
              let dayNumberk = dayNumber(day);
              db.TransactionDeatailsSave(accountNo, "EMI", parseInt(loanEMI.loanEmiAmount), (parseInt(crAmount) - parseInt(loanEMI.loanEmiAmount)) , getDate(), loanEMI.branchName, "withdrawal", dayNumberk, loanEMI.BankerId)
                .then((foundCustomer) => {
                 db.updateRunningEMI(accountNo, emiId, (parseInt(loanEMI.totalPayable) - parseInt(loanEMI.loanEmiAmount)) , getDateAfter(1), (parseInt(loanEMI.noInstallments) - 1) )
                    .then((posts) => {
                      if ( ( parseInt(loanEMI.noInstallments) - 1 ) === 0) {
                        db.delateEMISubdoc(accountNo, emiId)
                          .then((posts) => {
                           db.deleteLoanSubDoc( accountNo, loanId )
                             .then(()=>{
                              db.updateAnyEMIIsHere( accountNo )
                              .then(()=>{
                               console.log("sucess update") 
                              })
                              .catch((err)=>{
                               console.log(err);
                               assert.isNotOk(err,'Promise error');
                               done();
                              }) 
                             })
                             .catch((err)=>{
                              console.log(err);
                              assert.isNotOk(err,'Promise error');
                              done();
                             })
                            })
                          .catch((err) => {
                            console.log(err);
                            assert.isNotOk(err,'Promise error');
                            done();
                          })
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                      assert.isNotOk(err,'Promise error');
                      done();
                    })
                })
                .catch((err) => {
                  console.log(err);
                  assert.isNotOk(err,'Promise error');
                  done();
                })
            })
            .catch((err) => {
              console.log(err);
              assert.isNotOk(err,'Promise error');
              done();
            })
        }
      })
    })
    .catch((err) => {
      console.log(err);
      assert.isNotOk(err,'Promise error');
      done();
    })
}


//encrypt
function encryptText(text) {
  let cipherText = cryptr.encrypt( text );
 return cipherText;
}
// Decrypt
function decryptText(encryptedcode) {
  let originalText = cryptr.decrypt(encryptedcode);
  return originalText;
}

// db.AddUser( "user@123", "password@pass", "banker", "no" )
// .then((post)=>{
//   console.log("sucess to add user");
// })
// .catch((err) =>{
//   console.log("fail to add user");
// })


//-------------------------------------------------------------------------routing------------------------------------------------------------------------
//home route
app.get("/", (req, res) => {
  res.render("home");
});
//----------------------------------------------------------contact mail-----------------------------------------------------

//----------------------------------------------------login--------------------------------------------------------
app.get("/login", (req, res) => {
  res.render("loginOld", {
    match: " ",
    userType: " "
  });
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});
app.post("/login", (req, res) => {
  if (req.body.banker === 'banker') {
    db.getUser(req.body.username , "banker")
      .then((user) => {
        if (user) {
          db.Userlogin(req.body.password, user.password)
            .then((result) => {
              if (result == true) {
                const userID = encryptText(req.body.username)
                const requestedUrl = "/tab/banker/" + userID;
                res.redirect(requestedUrl);
              } else {
                let goUrl = "/login/tryaagain/banker";
                res.redirect(goUrl);
              }
            })
            .catch((err) => {
              let goUrl = "/login/tryaagain/banker";
              res.redirect(goUrl);
            })
        } else {
          let goUrl = "/login/tryaagain/banker";
          res.redirect(goUrl);
        }
      })
      .catch((err) => {
        console.log(err);
        let goUrl = "/login/tryaagain/banker";
        res.redirect(goUrl);
      })
  }
  else if (req.body.customer === 'customer') {
    db.getUser(req.body.username, "customer")
      .then((user) => {
        if (user) {
          db.Userlogin(req.body.password, user.password)
            .then((result) => {
              if (result == true) {
                const userID = encryptText(req.body.username);
                const requestedUrl = "/tab/customer/" + userID + "/home";
                res.redirect(requestedUrl);
              } else {
                let goUrl = "/login/tryaagain/customer";
                res.redirect(goUrl);
              }
            })
            .catch((err) => {
              let goUrl = "/login/tryaagain/customer";
              res.redirect(goUrl);
            })
        } else {
          let goUrl = "/login/tryaagain/customer";
          res.redirect(goUrl);
        }
      })
      .catch((err) => {
        console.log(err);
        let goUrl = "/login/tryaagain/customer";
        res.redirect(goUrl);
      })
  }
});


app.get("/login/tryaagain/:userType", (req, res) => {
  let user = req.params.userType;
  res.render("loginOld", {
    match: "yes",
    userType: user
  });
});

//----------------------------------------------------------------customer singup--------------------------------------------------
app.get("/customersingup", (req, res) => {
  res.render("customerSingUp", {
    otpMatch: " ",
    signUp: "yes",
    updatepass: " "
  });
});
app.post("/OtpSend", (req, res) => {
  let AccountNo = req.body.username;
  db.getCustomer(AccountNo)
    .then((user) => {
      if (user) {
        if (user.isCustomerOnline === "no") {
          let passWord = req.body.password;
          res.render("otpCheckForSignUp", {
            AccountNo: AccountNo,
            passWord: passWord,
            OTP: user.secrateKey,
            userExist: "yes",
            passwordUpdate: " ",
            signUp: "yes"
          });
        } else {
          res.redirect("/login");
        }
      } else {
        res.render("otpCheckForSignUp", {
          AccountNo: AccountNo,
          userExist: "no",
          passwordUpdate: " ",
          signUp: "yes"
        });
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/checkingOTP", (req, res) => {
  if (req.body.userOtp == req.body.serverOTP) {
    let accountNo = req.body.AccountNo;
    let passw = req.body.passWord;
    db.AddUser(accountNo, passw, "customer", "no")
      .then((posts) => {
        console.log("sucess");
        db.updateCustomerOnlineStatus(accountNo)
          .then((posts) => {
            res.render("sucessRegisted", {
              passwordUpdate: " ",
              signUp: "yes"
            });
          })
          .catch((err) => {
            assert.isNotOk(err, 'Promise error');
            done();
            res.redirect("/login");
          })
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        res.redirect("/login");
      })


  } else {
    res.render("customerSingUp", {
      otpMatch: "no",
      signUp: "yes",
      updatepass: " "
    });
  }
});
//------------------------------------------------------Banker Home-----------------------------------------------
//Tab route
app.get("/tab/banker/:urlUser", (req, res) => {
  const encriptedBankerId = req.params.urlUser;
  res.render("Tab", {
    user: encriptedBankerId
  });
});

app.get("/tab/autoupdate/:urlUser", (req, res) => {
  FixedDipositUpdate()
  EMIPaymentUpdate()
  let goUrl = "/tab/banker/" + req.params.urlUser;
  res.redirect(goUrl);
});

//---------------------------------------------------------------------Banker-------------------------------------------------------------------

//----------------------------------------New Member register-----------------------------------------
app.get("/tab/banker/:urlUser/member", (req, res) => {
  const encriptedBankerId = req.params.urlUser;
  res.render("register", {
    user: encriptedBankerId,
    overviewhm: "uperr",
    overviewcr: "overview",
    overviewd: " ",
    overvieww: " ",
    overviewle: " ",
    overviewee: " ",
    overviewfd: " ",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: "bg",
    bgd: " ",
    bgw: " ",
    bgle: " ",
    bgee: " ",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  });
});

app.post("/memberRegister/:urlUser", uploadMultiple, function (req, res, next) {
  const encriptedBankerId = req.params.urlUser;
  const decriptedBankerId = decryptText(req.params.urlUser);
  db.newCustomerEntry(req.body.fName, req.body.mName, req.body.lName, req.body.ffName, req.body.fmName, req.body.flName, req.body.gender, req.body.marriageStatus, req.body.address, req.body.phone, req.body.pin, req.body.panNo, req.body.voter, req.body.adhar, req.body.email, req.body.dob, req.body.occupation, req.body.accountType, req.body.nominiName, req.body.nominiRelation, decriptedBankerId, req.files.passportSizePhoto[0].buffer, req.files.Signature[0].buffer)
    .then((item) => {
      let encriptedAccountNo = encryptText(item.AccountNo)
      const requestedUrl = "/memberRegister/sucess/" + encriptedBankerId + "/" + encriptedAccountNo;
      res.redirect(requestedUrl);
    })
    .catch((err) => {
      console.log(err);
      const requestedUrl = "/memberRegister/fail/" + encriptedBankerId;
      res.redirect(requestedUrl);
    })
});

//sucess
app.get("/memberRegister/sucess/:urlBanker/:saveAccNo", (req, res) => {
  const requestedAccountNo = decryptText(req.params.saveAccNo);
  const requestedBanker = req.params.urlBanker;
  res.render("sucess", {
    AcNo: requestedAccountNo,
    requestedTitel: requestedBanker
  });
});
//fail
app.get("/memberRegister/fail/:urlBanker", (req, res) => {
  const requestedBanker = req.params.urlBanker;
  const goUrl = "/tab/banker/" + requestedBanker + "/member"
  res.render("failure", {
    backUrl: goUrl
  });
});
//-------------------------------------------search customer----------------------------------------------
app.post("/search/:BankerId", (req, res) => {
  const BankerId = req.params.BankerId;
  let UrlCr = "/" + req.body.SearchBtn + "/" + encryptText(req.body.uniqueAccountNo) + "/" + BankerId;
  res.redirect(UrlCr);
});
//-------------------------------------------deposit-----------------------------------------------------
app.get("/tab/banker/:urlUser/deposit", (req, res) => {
  const BankerId = req.params.urlUser;
  res.render("deposit", {
    depositBtn: " ",
    customer: " ",
    user: BankerId,
    overviewhm: " ",
    overviewcr: " ",
    overviewd: "overview",
    overvieww: "lowerr",
    overviewle: " ",
    overviewee: " ",
    overviewfd: " ",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: "bg",
    bgw: " ",
    bgle: " ",
    bgee: " ",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  });
});

//Search Response
app.get("/deposit/:urlAccountNo/:BankerId", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo);
  const enBankerId = req.params.BankerId;
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      res.render("deposit", {
        depositBtn: "depositBtn",
        customer: user,
        user: enBankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: "overview",
        overvieww: "lowerr",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: "bg",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

//new Deposit Enter & save
app.post("/deposit/:bankerId/:accountno/save", (req, res) => {
  let deRequestedAccountNo = req.params.accountno;
  let enRequestedAccountNo = encryptText(req.params.accountno)
  let enBankerId = req.params.bankerId;
  let deBankerId = decryptText(req.params.bankerId);
  let getFromDeposit = parseInt(req.body.depositAmount);
  let getFromDepositTotal = parseInt(req.body.currentAmount);
  let currentTotalAmount = getFromDeposit + getFromDepositTotal;
  let day = getOnlyDate();
  let dayNumberk = dayNumber(day);
  db.updateCurentTotalAmount(deRequestedAccountNo, currentTotalAmount)
    .then((posts) => {
      db.TransactionDeatailsSave(deRequestedAccountNo, req.body.depositType, getFromDeposit, currentTotalAmount, getDate(), req.body.branchName, "Deposit", dayNumberk, deBankerId)
        .then((foundCustomer) => {
          let sucessUrl = "/deposit/sucess/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(sucessUrl);
        })
        .catch((err) => {
          assert.isNotOk(err, 'Promise error');
          done();
          let failUrl = "/deposit/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      let failUrl = "/deposit/fail/" + enBankerId + "/" + enRequestedAccountNo;
      res.redirect(failUrl);
    })
});

//sucess & fail Msg
app.get("/deposit/sucess/:urlBanker/:AccNo", (req, res) => {
  const requestedBanker = req.params.urlBanker;
  let reqDepoait = "/tab/banker/" + requestedBanker + "/deposit";
  res.render("sucessMsg", {
    backUrl: reqDepoait
  });
});

app.get("/deposit/fail/:urlBanker/:AccNo", (req, res) => {
  let reqDepoait = "/deposit/" + req.params.AccNo + "/" + req.params.urlBanker;
  res.render("fail", {
    backUrl: reqDepoait
  });
});
//------------------------------------------withdrawal---------------------------------------------------
app.get("/tab/banker/:urlUser/withdrawal", (req, res) => {
  const BankerId = req.params.urlUser;
  res.render("withdrawal", {
    withdrawalBtn: " ",
    customer: " ",
    user: BankerId,
    overviewhm: " ",
    overviewcr: " ",
    overviewd: "uperr",
    overvieww: "overview",
    overviewle: "lowerr",
    overviewee: " ",
    overviewfd: " ",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: " ",
    bgw: "bg",
    bgle: " ",
    bgee: " ",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  })

});

//Search Response
app.get("/withdrawal/:urlAccountNo/:BankerId", (req, res) => {
  const requestedAccountNo = decryptText(req.params.urlAccountNo);
  const BankerId = req.params.BankerId;
  db.getCustomer(requestedAccountNo)
    .then((user) => {
      res.render("withdrawal", {
        withdrawalBtn: "withdrawalBtn",
        customer: user,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: "uperr",
        overvieww: "overview",
        overviewle: "lowerr",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: "bg",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

//WithDrawal Entery & save
app.post("/withdrawal/:bankerId/:accountno/save", (req, res) => {
  const deRequestedAccountNo = req.params.accountno;
  const enRequestedAccountNo = encryptText(req.params.accountno);
  const enBankerId = req.params.bankerId;
  const deBankerId = decryptText(req.params.bankerId);
  let getFromWithdrawal = parseInt(req.body.withdrawalAmount);
  let getFromWithdrawalTotal = parseInt(req.body.currentAmount);
  let currentTotalAmount = getFromWithdrawalTotal - getFromWithdrawal;
  let currentAmountLoan = parseInt(req.body.LoanAmount) - parseInt(req.body.withdrawalAmount);
  let withdrawalFromLoan = parseInt(req.body.totalLoanAmountWithdrawal) + parseInt(req.body.withdrawalAmount);
  if (req.body.withdeawalFrom === "Loan") {
    if (currentAmountLoan >= 500) {
      db.withdrowalFromLoan(deRequestedAccountNo, req.body.LoanAmountID, currentAmountLoan, withdrawalFromLoan)
        .then((doc) => {
          let day = getOnlyDate();
          let dayNumberk = dayNumber(day);
          db.TransactionDeatailsSave(deRequestedAccountNo, req.body.withdeawalType, getFromWithdrawal, currentAmountLoan, getDate(), req.body.branchName, "withdrawal Loan", dayNumberk, deBankerId)
            .then((foundCustomer) => {
              let sucessUrl = "/withdrawal/sucess/" + enBankerId + "/" + enRequestedAccountNo;
              res.redirect(sucessUrl);
            })
            .catch((err) => {
              assert.isNotOk(err, 'Promise error');
              done();
              let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
              res.redirect(failUrl);
            })
        })
        .catch((err) => {
          assert.isNotOk(err, 'Promise error');
          done();
          let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        })

    } else {
      let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
      res.redirect(failUrl);
    }
  } else {
    if (currentTotalAmount >= 500) {
      db.updateCurentTotalAmount(deRequestedAccountNo, currentTotalAmount)
        .then((posts) => {
          let day = getOnlyDate();
          let dayNumberk = dayNumber(day);
          db.TransactionDeatailsSave(deRequestedAccountNo, req.body.withdeawalType, req.body.withdrawalAmount, currentTotalAmount, getDate(), req.body.branchName, "withdrawal", dayNumberk, deBankerId)
            .then((foundCustomer) => {
              let sucessUrl = "/withdrawal/sucess/" + enBankerId + "/" + enRequestedAccountNo;
              res.redirect(sucessUrl);
            })
            .catch((err) => {
              assert.isNotOk(err, 'Promise error');
              done();
              let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
              res.redirect(failUrl);
            })
        })
        .catch((err) => {
          assert.isNotOk(err, 'Promise error');
          done();
          let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        })
    } else {
      let failUrl = "/withdrawal/fail/" + enBankerId + "/" + enRequestedAccountNo;
      res.redirect(failUrl);
    }
  }
});

//sucess
app.get("/withdrawal/sucess/:urlBanker/:AccNo", (req, res) => {
  const requestedBanker = req.params.urlBanker;
  let reqwithdrawal = "/tab/banker/" + requestedBanker + "/withdrawal";
  res.render("sucessMsg", {
    backUrl: reqwithdrawal
  });
});

//fail
app.get("/withdrawal/fail/:urlBanker/:AccNo", (req, res) => {
  const requestedAccountNo = req.params.AccNo;
  const requestedBanker = req.params.urlBanker;
  let reqwithdrawal = "/withdrawal/" + requestedAccountNo + "/" + requestedBanker;
  res.render("fail", {
    backUrl: reqwithdrawal
  });
});
//------------------------------------------------NewLoanEntery------------------------------------------------
app.get("/tab/banker/:urlUser/loan/NewLoanEntry", (req, res) => {
  const BankerId = req.params.urlUser;
  res.render("loanEntry", {
    loanEntryBtn: " ",
    customer: " ",
    user: BankerId,
    overviewhm: " ",
    overviewcr: " ",
    overviewd: " ",
    overvieww: "uperr",
    overviewle: "overview",
    overviewee: "lowerr",
    overviewfd: " ",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: " ",
    bgw: " ",
    bgle: "bg",
    bgee: " ",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  })
});

app.get("/loanEntry/:urlAccountNo/:BankerId", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo)
  const BankerId = req.params.BankerId;
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      res.render("loanEntry", {
        loanEntryBtn: "loanEntryBtn",
        customer: user,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: "uperr",
        overviewle: "overview",
        overviewee: "lowerr",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: "bg",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/loanEntry/:bankerId/:urlAccountnok/save", (req, res) => {
  const deRequestedAccountNo = req.params.urlAccountnok;
  const enRequestedAccountNo = encryptText(deRequestedAccountNo);
  const enBankerId = req.params.bankerId;
  const deBankerId = decryptText(req.params.bankerId);
  if (req.body.buttonType === "cancel") {
    db.loanApllicationDelete(req.body.applicationID)
      .then((posts) => {
        let urlGo = "/tab/banker/" + enBankerId + "/LoanApproval"
        res.redirect(urlGo);
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        res.redirect("/login");
      })
  } else {
    const period = parseInt(req.body.loanPeriod);
    const EmiStatrtLastDate = getDateAfter(period);
    let valuek = 0;
    db.loanDataEntry(deRequestedAccountNo, req.body.monthlyIncome, req.body.loanAmount, req.body.creditScore, req.body.sanctionAmountLoan, req.body.loanPeriod, EmiStatrtLastDate, req.body.loanType, req.body.loanNominee, valuek, req.body.intarestrate, req.body.sanctionAmountLoan, valuek, getOnlyDate(), getDate(), deBankerId)
      .then((foundCustomer) => {
        if (req.body.buttonType === "approved") {
              db.deleteLoanAllApplication(deRequestedAccountNo)
              .then((resultk)=>{
                let urlGo = "/tab/banker/" + enBankerId + "/LoanApproval"
                res.redirect(urlGo);
              })
              .catch((err)=>{
                assert.isNotOk(err, 'Promise error');
                done();
                let failUrl = "/loanApplicationApproval/fail/" + enBankerId;
                res.redirect(failUrl);
              })
        } else {
          db.deleteLoanAllApplication(deRequestedAccountNo)
          .then((resultk)=>{
            let sucessUrl = "/loanApplicationApproval/sucess/" + enBankerId + "/" + enRequestedAccountNo;
            res.redirect(sucessUrl);
          })
          .catch((err)=>{
            assert.isNotOk(err, 'Promise error');
            done();
            let failUrl = "/loanApplicationApproval/fail/" + enBankerId + "/" + enRequestedAccountNo;
            res.redirect(failUrl);
          })
        }
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        if (req.body.buttonType === "approved") {
          let failUrl = "/loanApplicationApproval/fail/" + enBankerId;
          res.redirect(failUrl);
        } else {
          let failUrl = "/loanApplicationApproval/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        }
      })
  }
});
//sucess
app.get("/loanApplicationApproval/sucess/:urlBanker/:AccNo", (req, res) => {
  const requestedBanker = req.params.urlBanker;
  let reqwithdrawal = "/tab/banker/" + requestedBanker + "/loan/NewLoanEntry";
  res.render("sucessMsg", {
    backUrl: reqwithdrawal
  });
});
//fail
app.get("/loanApplicationApproval/fail/:urlBanker/:AccNo", (req, res) => {
  const requestedAccountNo = req.params.AccNo;
  const requestedBanker = req.params.urlBanker;
  let reqwithdrawal = "/loanEntry/" + requestedAccountNo + "/" + requestedBanker;
  res.render("fail", {
    backUrl: reqwithdrawal
  });
});

// approve fail 
app.get("/loanApplicationApproval/fail/:BankerId", (req, res) => {
  let reqwithdrawal = "/tab/banker/" + req.params.BankerId + "/LoanApproval";
  res.render("fail", {
    backUrl: reqwithdrawal
  });
});
//---------------------------------------------------------emiEntery-----------------------------------------------
app.get("/tab/banker/:BankerId/loan/EMIentry", (req, res) => {
  const BankerId = req.params.BankerId;
  res.render("emiEntry", {
    emiEntryBtn: " ",
    customer: " ",
    user: BankerId,
    overviewhm: " ",
    overviewcr: " ",
    overviewd: " ",
    overvieww: " ",
    overviewle: "uperr",
    overviewee: "overview",
    overviewfd: "lowerr",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: " ",
    bgw: " ",
    bgle: " ",
    bgee: "bg",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  })
});

app.get("/emiEntry/:urlAccountNo/:BankerId", (req, res) => {
  const enRequestedAccountNo = req.params.urlAccountNo;
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo);
  const enBankerId = req.params.BankerId;
  const deBankerId = decryptText(req.params.BankerId);
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      if (user && user.loanAplicationEntery[0]) {
        let day1 = user.loanAplicationEntery[0].dateToCalculateIntarest;
        let day2 = getOnlyDate();
        let dayDif = DaysBitweentwoDays(day1, day2);
        dayDif = parseInt(dayDif);
        let intarestRate = user.loanAplicationEntery[0].loanIntarestRate;
        let totalWithdrawalAmount = parseInt(user.loanAplicationEntery[0].totalAmountWithdrawal);
        let r = intarestRate / 100;
        let RbyN = (r / 12) + 1;
        let t = dayDif / 365;
        let TintoN = t * 12;
        let powerget = (RbyN ** TintoN)
        let totalAmountwithIntarest = totalWithdrawalAmount * powerget;
        let intarestNow = totalAmountwithIntarest - totalWithdrawalAmount;
        let emi1t, emi2t, emi3t, emi4t, emi5t, emi6t, emi7t, emi8t, emi9t, emi10t, emi11t, emi12t, emi13t, emi14t;
        let ints1t, ints2t, ints3t, ints4t, ints5t, ints6t, ints7t, ints8t, ints9t, ints10t, ints11t, ints12t, ints13t, ints14t;
        emi1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) / 6;
        emi2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) / 12;
        emi3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) / 18;
        emi4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) / 24;
        emi5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) / 30;
        emi6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) / 36;
        emi7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) / 42;
        emi8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) / 48;
        emi9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) / 54;
        emi10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) / 60;
        emi11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) / 66;
        emi12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) / 72;
        emi13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) / 78;
        emi14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) / 84;
        ints1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) - totalWithdrawalAmount;
        ints2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) - totalWithdrawalAmount;
        ints3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) - totalWithdrawalAmount;
        ints4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) - totalWithdrawalAmount;
        ints5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) - totalWithdrawalAmount;
        ints6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) - totalWithdrawalAmount;
        ints7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) - totalWithdrawalAmount;
        ints8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) - totalWithdrawalAmount;
        ints9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) - totalWithdrawalAmount;
        ints10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) - totalWithdrawalAmount;
        ints11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) - totalWithdrawalAmount;
        ints12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) - totalWithdrawalAmount;
        ints13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) - totalWithdrawalAmount;
        ints14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) - totalWithdrawalAmount;
        res.render("emiEntry", {
          emiEntryBtn: "emiEntryBtn",
          customer: user,
          user: enBankerId,
          emi1t: parseInt(emi1t),
          emi2t: parseInt(emi2t),
          emi3t: parseInt(emi3t),
          emi4t: parseInt(emi4t),
          emi5t: parseInt(emi5t),
          emi6t: parseInt(emi6t),
          emi7t: parseInt(emi7t),
          emi8t: parseInt(emi8t),
          emi9t: parseInt(emi9t),
          emi10t: parseInt(emi10t),
          emi11t: parseInt(emi11t),
          emi12t: parseInt(emi12t),
          emi13t: parseInt(emi13t),
          emi14t: parseInt(emi14t),
          ints1t: ints1t,
          ints2t: ints2t,
          ints3t: ints3t,
          ints4t: ints4t,
          ints5t: ints5t,
          ints6t: ints6t,
          ints7t: ints7t,
          ints8t: ints8t,
          ints9t: ints9t,
          ints10t: ints10t,
          ints11t: ints11t,
          ints12t: ints12t,
          ints13t: ints13t,
          ints14t: ints14t,
          totalWithdrawalAmount: parseInt(totalWithdrawalAmount),
          intarestNow: parseInt(intarestNow),
          totalAmountwithIntarest: parseInt(totalAmountwithIntarest),
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: "uperr",
          overviewee: "overview",
          overviewfd: "lowerr",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: " ",
          overviewed: " ",
          bghm: " ",
          bgcr: "bg",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: "bg",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: " "
        })
      } else {
        res.render("emiEntry", {
          emiEntryBtn: "emiEntryBtn",
          customer: user,
          user: enBankerId,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: "uperr",
          overviewee: "overview",
          overviewfd: "lowerr",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: " ",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: "bg",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: " "
        });
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/loan/EMIentry/:BankerId/save", (req, res) => {
  const enBankerId = req.params.BankerId;
  const deBankerId = decryptText(req.params.BankerId);
  const enRequestedAccountNo = encryptText(req.body.AccountNo)
  if (req.body.buttonType === "cancel") {
    db.deleteEMIApplication(req.body.applicationID)
      .then((posts) => {
        let urlGo = "/tab/banker/" + enBankerId + "/EMIApproval";
        res.redirect(urlGo);
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
      })
  } else {
    let currentTotalAmount = parseInt(req.body.TotalAmount) - parseInt(req.body.loanEmiAmount);
    if (currentTotalAmount >= 500) {
      db.totalAmountWithStartEMI(req.body.AccountNo, currentTotalAmount)
        .then((posts) => {
          let day = getOnlyDate();
          let dayNumberk = dayNumber(day);
          db.TransactionDeatailsSave(req.body.AccountNo, "EMI Start", parseInt(req.body.loanEmiAmount), currentTotalAmount, getDate(), req.body.branchName, "withdrawal", dayNumberk, deBankerId)
            .then((foundCustomer) => {
              let noInstallments = parseInt(req.body.noInstallments) - 1;
              let payable = (parseInt(req.body.noInstallments) * parseInt(req.body.loanEmiAmount)) - parseInt(req.body.loanEmiAmount);
              db.EMIDataEntry(req.body.AccountNo, req.body.branchName, req.body.AccountNo, req.body.loanPlanCode, "From Main Bank Balance", noInstallments, payable, req.body.loanEmiAmount, getOnlyDate(), "yes", deBankerId, getDateAfter(1), req.body.loanAdvisorName)
                .then((foundCustomer) => {
                  if (req.body.buttonType === "approves") {
                    db.deleteEmiAllApplication( req.body.AccountNo )
                      .then((posts) => {
                        let urlGo = "/tab/banker/" + enBankerId + "/EMIApproval";
                        res.redirect(urlGo);
                      })
                      .catch((err) => {
                        assert.isNotOk(err, 'Promise error');
                        done(); 
                        let failUrl = "/EMIentry/fail/" + enBankerId;
                        res.redirect(failUrl);
                      })
                  } else {
                    db.deleteEmiAllApplication( req.body.AccountNo )
                    .then((posts) => {
                      let sucessUrl = "/LoanPayment/sucess/" + enBankerId + "/" + enRequestedAccountNo;
                      res.redirect(sucessUrl);
                    })
                    .catch((err) => {
                      assert.isNotOk(err, 'Promise error');
                      done();
                      let failUrl = "/EMIentry/fail/" + enBankerId;
                      res.redirect(failUrl);
                    })
                  }
                }) 
                .catch((err) => {
                  assert.isNotOk(err, 'Promise error');
                  done();
                  if (req.body.buttonType === "approves") {
                    let failUrl = "/EMIentry/fail/" + enBankerId;
                    res.redirect(failUrl);
                  } else {
                    let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
                    res.redirect(failUrl);
                  }
                })
            })
            .catch((err) => {
              assert.isNotOk(err, 'Promise error');
              done();
              if (req.body.buttonType === "approves") {
                let failUrl = "/EMIentry/fail/" + enBankerId;
                res.redirect(failUrl);
              } else {
                let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
                res.redirect(failUrl);
              }
            })
        })
        .catch((err) => {
          assert.isNotOk(err, 'Promise error');
          done();
          let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        })
    } else {
      if (req.body.buttonType === "approves") {
        let failUrl = "/EMIentry/fail/" + enBankerId;
        res.redirect(failUrl);
      } else {
        let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
        res.redirect(failUrl);
      }
    }
  }
});

//fail 
app.get("/EMIentry/fail/:BankerId", (req, res) => {
  let reqwithdrawal = "/tab/banker/" + req.params.BankerId + "/EMIApproval";
  res.render("fail", {
    backUrl: reqwithdrawal
  });
});

app.post("/loan/Onepayment/:BankerId/save", (req, res) => {
  const deRequestedAccountNo = req.body.AccountNo;
  const enRequestedAccountNo = encryptText(req.body.AccountNo);
  const enBankerId = req.params.BankerId;
  const deBankerId = decryptText(req.params.BankerId);
  let currentTotalAmount = parseInt(req.body.TotalAmount) - parseInt(req.body.totalAmountwithIntarest);
  let haveToPay = parseInt(req.body.haveToPay);
  let haveToPayK = parseInt(req.body.totalAmountwithIntarest);
  if (currentTotalAmount >= 500 && haveToPayK === haveToPay) {
    db.updateCurentTotalAmount(deRequestedAccountNo, currentTotalAmount)
      .then((posts) => {
        let day = getOnlyDate();
        let dayNumberk = dayNumber(day);
        db.TransactionDeatailsSave(deRequestedAccountNo, "Cut to Clear The Full Loan Amount", parseInt(req.body.totalAmountwithIntarest), currentTotalAmount, getDate(), req.body.branchName, "withdrawal", dayNumberk, deBankerId)
          .then((foundCustomer) => {
            db.deleteLoanSubDoc(deRequestedAccountNo, req.body.loanId)
              .then((posts) => {
                db.deleteEmiAllApplication( derequestedAccountNo )
                .then((resultk) =>{
                  let sucessUrl = "/LoanPayment/sucess/" + enBankerId + "/" + enRequestedAccountNo;
                  res.redirect(sucessUrl);
                })
                .catch((err)=>{
                  assert.isNotOk(err, 'Promise error');
                  done();
                  let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
                  res.redirect(failUrl);
                })
              })
              .catch((err) => {
                assert.isNotOk(err, 'Promise error');
                done();
                let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
                res.redirect(failUrl);
              })
          })
          .catch((err) => {
            assert.isNotOk(err, 'Promise error');
            done();
            let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
            res.redirect(failUrl);
          })
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
        res.redirect(failUrl);
      })
  } else {
    let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
    res.redirect(failUrl);
  }
});

//fail
app.get("/LoanPayment/fail/:BankerId/:AccountNo", (req, res) => {
  const requestedAccountNo = req.params.AccountNo;
  const requestedBanker = req.params.BankerId;
  let reqwithdrawal = "/emiEntry/" + requestedAccountNo + "/" + requestedBanker;
  res.render("fail", {
    backUrl: reqwithdrawal
  });
});

//sucess
app.get("/LoanPayment/sucess/:BankerId/:AccountNo", (req, res) => {
  const requestedBanker = req.params.BankerId;
  let reqwithdrawal = "/tab/banker/" + requestedBanker + "/loan/EMIentry";
  res.render("sucessMsg", {
    backUrl: reqwithdrawal
  });
});

app.post("/loan/paybackPrimeAmountorIntarest/:BankerId/save", (req, res) => {
  const enBankerId = req.params.BankerId;
  const deBankerId = decryptText(req.params.BankerId);
  const enRequestedAccountNo = encryptText(req.body.AccountNo);
  const deRequestedAccountNo = req.body.AccountNo;
  let currentTotalAmount = parseInt(req.body.TotalAmount) - parseInt(req.body.primeAmount)
  if (currentTotalAmount >= 500) {
    db.updateCurentTotalAmount(deRequestedAccountNo, currentTotalAmount)
      .then((posts) => {
        let day = getOnlyDate();
        let dayNumberk = dayNumber(day);
        db.TransactionDeatailsSave(deRequestedAccountNo, "Cut to Reduce The Loan Amount", parseInt(req.body.primeAmount), currentTotalAmount, getDate(), req.body.branchName, "withdrawal", dayNumberk, deBankerId)
          .then((foundCustomer) => {
            let day1 = foundCustomer.loanAplicationEntery[0].dateToCalculateIntarest;
            let day2 = getOnlyDate();
            let dayDif = DaysBitweentwoDays(day1, day2);
            dayDif = parseInt(dayDif);
            let intarestRate = foundCustomer.loanAplicationEntery[0].loanIntarestRate;
            let totalWithdrawalAmount = parseInt(foundCustomer.loanAplicationEntery[0].totalAmountWithdrawal);
            let r = intarestRate / 100;
            let RbyN = (r / 12) + 1;
            let t = dayDif / 365;
            let TintoN = t * 12;
            let powerget = (RbyN ** TintoN)
            let totalAmountwithIntarest = totalWithdrawalAmount * powerget;
            let withdrawalFromLoan = totalAmountwithIntarest - parseInt(req.body.primeAmount)
            db.payBackLoan(deRequestedAccountNo, req.body.loanId, withdrawalFromLoan, getOnlyDate())
              .then((doc) => {
                let sucessUrl = "/LoanPayment/sucess/" + enBankerId + "/" + enRequestedAccountNo;
                res.redirect(sucessUrl);
              })
              .catch((err) => {
                assert.isNotOk(err, 'Promise error');
                done();
                let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
                res.redirect(failUrl);
              })
          })
          .catch((err) => {
            assert.isNotOk(err, 'Promise error');
            done();
            let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
            res.redirect(failUrl);
          })
      })
      .catch((err) => {
        console.log("in current amount update");
        console.log(err);
        assert.isNotOk(err, 'Promise error');
        done();
        let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
        res.redirect(failUrl);
      })


  } else {
    let failUrl = "/LoanPayment/fail/" + enBankerId + "/" + enRequestedAccountNo;
    res.redirect(failUrl);
  }
});
//-------------------------------------------------------------fixed Diposit-------------------------------------------------------
app.get("/tab/banker/:urlUser/fd", (req, res) => {
  const BankerId = req.params.urlUser;
  res.render("fixedDeposit", {
    fixedDepositBtn: " ",
    customer: " ",
    user: BankerId,
    overviewhm: " ",
    overviewcr: " ",
    overviewd: " ",
    overvieww: " ",
    overviewle: " ",
    overviewee: "uperr",
    overviewfd: "overview",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: " ",
    overviewtd: " ",
    overviewld: " ",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: " ",
    bgw: " ",
    bgle: " ",
    bgee: " ",
    bgfd: "bg",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: " ",
    bgld: " ",
    bged: " "
  });
});

app.get("/fixedDeposit/:urlAccountNo/:BankerId", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo);
  const enBankerId = req.params.BankerId;
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      res.render("fixedDeposit", {
        fixedDepositBtn: "fixedDepositBtn",
        customer: user,
        user: enBankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: "uperr",
        overviewfd: "overview",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: "bg",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/fixedDiposit/save/:BankerId", (req, res) => {
  const enBankerId = req.params.BankerId;
  const deBankerId = decryptText(req.params.BankerId);
  const deRequestedAccountNo = req.body.accountNo;
  const enRequestedAccountNo = encryptText(deRequestedAccountNo);
  if (req.body.btn === "Cancel") {
    db.deleteFDApplication(req.body.ApplicationId)
      .then((posts) => {
        urlGo = "/tab/banker/" + enBankerId + "/fdApproval"
        res.redirect(urlGo);
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        let failUrl = "/fd/fail/" + enBankerId;
        res.redirect(failUrl);
      })
  } else {
    let currentTotalAmount = parseInt(req.body.activeAmount) - parseInt(req.body.fixedAmount);
    if (currentTotalAmount >= 500) {
      let fixedAmounttak = parseInt(req.body.fixedAmount);
      let interest = parseInt(req.body.interest);
      let duration = parseInt(req.body.duration);
      let finalAmount = fixedAmounttak + ((fixedAmounttak * interest * (duration / 12)) / 100);
      let abFinalAmount = parseInt(finalAmount);
      db.isAnyFbStatusWithTotalAmount(deRequestedAccountNo, currentTotalAmount)
        .then((posts) => {
          db.fixedDipositEntery(deRequestedAccountNo, parseInt(req.body.fixedAmount), abFinalAmount, getDate(), getDateAfter(duration), deBankerId)
            .then((foundCustomer) => {
              let day = getOnlyDate();
              let dayNumberk = dayNumber(day);
              db.TransactionDeatailsSave(deRequestedAccountNo, "Lock The Fixed Amount", parseInt(req.body.fixedAmount), currentTotalAmount, getDate(), "Nasaratpur", "withdrawal", dayNumberk, deBankerId)
                .then((foundCustomer) => {
                  if (req.body.btn === "Approved") {
                    db.deleteFDApplication(req.body.ApplicationId)
                      .then((posts) => {
                        let urlGo = "/tab/banker/" + enBankerId + "/fdApproval"
                        res.redirect(urlGo);
                      })
                      .catch((err) => {
                        assert.isNotOk(err, 'Promise error');
                        done();
                        if (req.body.btn === "Approved") {
                          let failUrl = "/fd/fail/" + enBankerId;
                          res.redirect(failUrl);
                        } else {
                          let failUrl = "/fd/fail/" + enBankerId + "/" + enRequestedAccountNo;
                          res.redirect(failUrl);
                        }
                      })
                  } else {
                    let sucessUrl = "/fd/sucess/" + enBankerId + "/" + enRequestedAccountNo;
                    res.redirect(sucessUrl);
                  }
                })
                .catch((err) => {
                  assert.isNotOk(err, 'Promise error');
                  done();
                  if (req.body.btn === "Approved") {
                    let failUrl = "/fd/fail/" + enBankerId;
                    res.redirect(failUrl);
                  } else {
                    let failUrl = "/fd/fail/" + enBankerId + "/" + enRequestedAccountNo;
                    res.redirect(failUrl);
                  }
                })
            })
            .catch((err) => {
              assert.isNotOk(err, 'Promise error');
              done();
              if (req.body.btn === "Approved") {
                let failUrl = "/fd/fail/" + enBankerId;
                res.redirect(failUrl);
              } else {
                let failUrl = "/fd/fail/" + enBankerId + "/" + enRequestedAccountNo;
                res.redirect(failUrl);
              }
            })
        })
        .catch((err) => {
          console.log("in current amount update" + err);
          assert.isNotOk(err, 'Promise error');
          done();
          let failUrl = "/fd/fail/" + enBankerId + "/" + enRequestedAccountNo;
          res.redirect(failUrl);
        })
    } else {
      let failUrl = "/fd/fail/" + enBankerId + "/" + enRequestedAccountNo;
      res.redirect(failUrl);
    }
  }
})

//sucess
app.get("/fd/sucess/:BankerId/:accountNo", (req, res) => {
  const requestedBanker = req.params.BankerId;
  let reqwithdrawal = "/tab/banker/" + requestedBanker + "/fd";
  res.render("sucessMsg", {
    backUrl: reqwithdrawal
  });
});
//fail
app.get("/fd/fail/:BankerId/:accountNo", (req, res) => {
  const requestedAccountNo = req.params.accountNo;
  const requestedBanker = req.params.BankerId;
  let reqwithdrawal = "/fixedDeposit/" + requestedAccountNo + "/" + requestedBanker;
  res.render("fail", {
    backUrl: reqwithdrawal
  });
})
//fail
app.get("/fd/fail/:BankerId", (req, res) => {
  const requestedBanker = req.params.BankerId;
  let reqwithdrawal = "/tab/banker/" + requestedBanker + "/fdApproval";
  res.render("fail", {
    backUrl: reqwithdrawal
  });
})
//----------------------------------------------------approval-------------------------------------------------------
app.post("/approvalsearch/:BankerId", (req, res) => {
  const BankerId = req.params.BankerId;
  let UrlCr = "/" + req.body.aprovalBtn + "/" + encryptText(req.body.uniqueAccountNo) + "/" + BankerId;
  res.redirect(UrlCr);
});

app.get("/tab/banker/:BankerId/fdApproval", (req, res) => {
  const BankerId = req.params.BankerId;
     db.allFDApplications()
     .then(( applications )=>{
      res.render("fdApprovalList", {
        applications: applications,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: "uperr",
        overviewfda: "overview",
        overviewla: "lowerr",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: "bg",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      });
       })
       .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
          res.redirect("/login");
        })
});

app.get("/fdapproval/:accountNo/:user", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.accountNo);
     db.fDApplication( deRequestedAccountNo )
     .then(( applications )=>{
      res.render("fdApprovalList", {
        applications: applications,
        user: req.params.user,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: "uperr",
        overviewfda: "overview",
        overviewla: "lowerr",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: "bg",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      });
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
          res.redirect("/login");
      })
});

app.get("/tab/banker/:BankerId/LoanApproval", (req, res) => {
  const BankerId = req.params.BankerId;
     db.allLoanApplication()
     .then((applications)=>{
      res.render("loanApproval", {
        applications: applications,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: "uperr",
        overviewla: "overview",
        overviewea: "lowerr",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: "bg",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      });
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
         res.redirect("/login");
      })
});

app.get("/loanapproval/:accountno/:user", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.accountno);
     db.loanApplication( deRequestedAccountNo )
      .then(( applications )=>{
        res.render("loanApproval", {
          applications: applications,
          user: req.params.user,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: "uperr",
          overviewla: "overview",
          overviewea: "lowerr",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: " ",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: "bg",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: " "
        });
       })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
          res.redirect("/login")
       })
});

app.get("/loanApplication/:urlAccountNo/:urlId/:BankerID/approval", (req, res) => {
  const loanApplicationID = req.params.urlId;
  const loanApplicationAccountNo = req.params.urlAccountNo;
  const BankerId = req.params.BankerID;
      db.getCustomer( loanApplicationAccountNo )
      .then((customer)=>{
             db.loanApplicationByID( loanApplicationID )
             .then(( application )=>{
              res.render("singleLoanApply", {
                application: application,
                customer: customer,
                user: BankerId,
                loanApplicationID: loanApplicationID,
                overviewhm: " ",
                overviewcr: " ",
                overviewd: " ",
                overvieww: " ",
                overviewle: " ",
                overviewee: " ",
                overviewfd: " ",
                overviewra: " ",
                overviewfda: "uperr",
                overviewla: "overview",
                overviewea: "lowerr",
                overviewcd: " ",
                overviewtd: " ",
                overviewld: " ",
                overviewed: " ",
                bghm: " ",
                bgcr: " ",
                bgd: " ",
                bgw: " ",
                bgle: " ",
                bgee: " ",
                bgfd: " ",
                bgra: " ",
                bgfda: " ",
                bgla: "bg",
                bgea: " ",
                bgcd: " ",
                bgtd: " ",
                bgld: " ",
                bged: " "
              });
              })
              .catch((err)=>{
                assert.isNotOk(err,'Promise error');
                done();
               res.redirect("/login")
              })
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
        res.redirect("/login");
      })
});

app.get("/tab/banker/:BankerId/EMIApproval", (req, res) => {
  const BankerId = req.params.BankerId;
     db.allEMIApplications()
     .then((applications)=>{
      res.render("emiApproval", {
        applications: applications,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: "uperr",
        overviewea: "overview",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: "bg",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      });
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
       res.redirect("/login")
      })
});

app.get("/emiapproval/:accountno/:BankerId", (req, res) => {
  const BankerId = req.params.BankerId;
  const deRequestedAccountNo = decryptText(req.params.accountno);
     db.EMIApplication( deRequestedAccountNo )
     .then(( applications )=>{
      res.render("emiApproval", {
        applications: applications,
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: "uperr",
        overviewea: "overview",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: "bg",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: " "
      });
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
        res.redirect("/login")
      })
});

app.get("/emiApplication/:urlAccountNo/:urlId/:BankerID/approval", (req, res) => {
  const loanApplicationID = req.params.urlId;
  const loanApplicationAccountNo = req.params.urlAccountNo;
  const BankerId = req.params.BankerID;
       db.getCustomer( loanApplicationAccountNo )
       .then(( customer )=>{
             db.EMIApplicationByID( loanApplicationID )
             .then((application)=>{
              let day1 = customer.loanAplicationEntery[0].dateToCalculateIntarest;
              let day2 = getOnlyDate();
              let dayDif = DaysBitweentwoDays(day1, day2);
              dayDif = parseInt(dayDif);
              let intarestRate = customer.loanAplicationEntery[0].loanIntarestRate;
              let totalWithdrawalAmount = parseInt(customer.loanAplicationEntery[0].totalAmountWithdrawal);
              let r = intarestRate / 100;
              let RbyN = (r / 12) + 1;
              let t = dayDif / 365;
              let TintoN = t * 12;
              let powerget = (RbyN ** TintoN)
              let totalAmountwithIntarest = totalWithdrawalAmount * powerget;
              let intarestNow = totalAmountwithIntarest - totalWithdrawalAmount;

              let emi1t, emi2t, emi3t, emi4t, emi5t, emi6t, emi7t, emi8t, emi9t, emi10t, emi11t, emi12t, emi13t, emi14t;
              let ints1t, ints2t, ints3t, ints4t, ints5t, ints6t, ints7t, ints8t, ints9t, ints10t, ints11t, ints12t, ints13t, ints14t;

              emi1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) / 6;
              emi2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) / 12;
              emi3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) / 18;
              emi4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) / 24;
              emi5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) / 30;
              emi6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) / 36;
              emi7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) / 42;
              emi8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) / 48;
              emi9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) / 54;
              emi10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) / 60;
              emi11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) / 66;
              emi12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) / 72;
              emi13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) / 78;
              emi14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) / 84;

              ints1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) - totalWithdrawalAmount;
              ints2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) - totalWithdrawalAmount;
              ints3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) - totalWithdrawalAmount;
              ints4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) - totalWithdrawalAmount;
              ints5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) - totalWithdrawalAmount;
              ints6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) - totalWithdrawalAmount;
              ints7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) - totalWithdrawalAmount;
              ints8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) - totalWithdrawalAmount;
              ints9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) - totalWithdrawalAmount;
              ints10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) - totalWithdrawalAmount;
              ints11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) - totalWithdrawalAmount;
              ints12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) - totalWithdrawalAmount;
              ints13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) - totalWithdrawalAmount;
              ints14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) - totalWithdrawalAmount;

              res.render("singleEmiApplication", {
                user: BankerId,
                application: application,
                customer: customer,
                loanApplicationID: loanApplicationID,
                emi1t: parseInt(emi1t),
                emi2t: parseInt(emi2t),
                emi3t: parseInt(emi3t),
                emi4t: parseInt(emi4t),
                emi5t: parseInt(emi5t),
                emi6t: parseInt(emi6t),
                emi7t: parseInt(emi7t),
                emi8t: parseInt(emi8t),
                emi9t: parseInt(emi9t),
                emi10t: parseInt(emi10t),
                emi11t: parseInt(emi11t),
                emi12t: parseInt(emi12t),
                emi13t: parseInt(emi13t),
                emi14t: parseInt(emi14t),
                ints1t: ints1t,
                ints2t: ints2t,
                ints3t: ints3t,
                ints4t: ints4t,
                ints5t: ints5t,
                ints6t: ints6t,
                ints7t: ints7t,
                ints8t: ints8t,
                ints9t: ints9t,
                ints10t: ints10t,
                ints11t: ints11t,
                ints12t: ints12t,
                ints13t: ints13t,
                ints14t: ints14t,
                totalWithdrawalAmount: parseInt(totalWithdrawalAmount),
                intarestNow: parseInt(intarestNow),
                totalAmountwithIntarest: parseInt(totalAmountwithIntarest),
                overviewhm: " ",
                overviewcr: " ",
                overviewd: "",
                overvieww: " ",
                overviewle: " ",
                overviewee: " ",
                overviewfd: " ",
                overviewra: " ",
                overviewfda: " ",
                overviewla: "uperr",
                overviewea: "overview",
                overviewcd: " ",
                overviewtd: " ",
                overviewld: " ",
                overviewed: " ",
                bghm: " ",
                bgcr: " ",
                bgd: " ",
                bgw: " ",
                bgle: " ",
                bgee: " ",
                bgfd: " ",
                bgra: " ",
                bgfda: " ",
                bgla: " ",
                bgea: "bg",
                bgcd: " ",
                bgtd: " ",
                bgld: " ",
                bged: " "
              })
              })
              .catch((err)=>{
                assert.isNotOk(err,'Promise error');
                done();
               res.redirect("/login")
              })
        })
        .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
         res.redirect("/login")
        })

});



//------------------------------------------------------------Details---------------------------------------------------------

//-----------------------------------------------Customer Details----------------------------------------------

app.get("/tab/banker/:urlUser/cmDetails", (req, res) => {
  const BankerId = req.params.urlUser;
  db.getAllCustomers()
    .then((customers) => {
      res.render("customerDetails", {
        customerDetailBtn: "all",
        customers: customers,
        customer: " ",
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: "overview",
        overviewtd: "lowerr",
        overviewld: " ",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: "bg",
        bgtd: " ",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.get("/customerDetails/:urlAccountNo/:BankerId", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo);
  const BankerId = req.params.BankerId;
  const deBankerId = decryptText( BankerId );
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      if (user && user.transactionEnterys[0]) {
        let transtionArraylen = user.transactionEnterys.length - 1;
        var latesttranstion = user.transactionEnterys[transtionArraylen];
      } else {
        var latesttranstion = " ";
      }
    db.getBanker( deBankerId )
      .then(( userkt ) => {
        res.render("customerDetails", {
          customerDetailBtn: "customerDetailBtn",
          customer: user,
          customers: " ",
          user: BankerId,
          type : userkt.allaccess,
          latesttranstion: latesttranstion,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: "overview",
          overviewtd: "lowerr",
          overviewld: " ",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: "bg",
          bgtd: " ",
          bgld: " ",
          bged: " "
        })
      })
      .catch((err) => {
        console.log(err);
        assert.isNotOk(err, 'Promise error');
        done();
        res.redirect("/login");
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});
app.get("/customerDetails/:urlAccountNo/:BankerId/direct", (req, res) => {
  const deRequestedAccountNo = req.params.urlAccountNo;
  const BankerId = req.params.BankerId;
  const deBankerId = decryptText( BankerId );
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      if (user.transactionEnterys[0]) {
        let transtionArraylen = user.transactionEnterys.length - 1;
        var latesttranstion = user.transactionEnterys[transtionArraylen];
      } else {
        var latesttranstion = " ";
      }
      db.getBanker( deBankerId )
      .then(( userkt ) => {
        res.render("customerDetails", {
          customerDetailBtn: "customerDetailBtn",
          customer: user,
          customers: " ",
          user: BankerId,
          type : userkt.allaccess,
          latesttranstion: latesttranstion,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: "overview",
          overviewtd: "lowerr",
          overviewld: " ",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: "bg",
          bgtd: " ",
          bgld: " ",
          bged: " "
        })
      })
      .catch((err)=>{
        console.log(err);
        assert.isNotOk(err, 'Promise error');
        done();
        res.redirect("/login");
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});
//---------------------------------------------------------transtion details-------------------------------------------------
app.get("/tab/banker/:urlUser/transactiondetails", (req, res) => {
  const BankerId = req.params.urlUser;
  res.render("transactiondetails", {
    transactiondetailsBtn: " ",
    customer: " ",
    user: BankerId,
    transactions: " ",
    overviewhm: " ",
    overviewcr: " ",
    overviewd: " ",
    overvieww: " ",
    overviewle: " ",
    overviewee: " ",
    overviewfd: " ",
    overviewra: " ",
    overviewfda: " ",
    overviewla: " ",
    overviewea: " ",
    overviewcd: "uperr",
    overviewtd: "overview",
    overviewld: "lowerr",
    overviewed: " ",
    bghm: " ",
    bgcr: " ",
    bgd: " ",
    bgw: " ",
    bgle: " ",
    bgee: " ",
    bgfd: " ",
    bgra: " ",
    bgfda: " ",
    bgla: " ",
    bgea: " ",
    bgcd: " ",
    bgtd: "bg",
    bgld: " ",
    bged: " "
  })
});

app.get("/transactiondetails/:urlAccountNo/:BankerId", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.urlAccountNo);
  const BankerId = req.params.BankerId;
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      if (user) {
        let fromDay = 18824;
        let day = getOnlyDate();
        let toDay = dayNumber(day); 
        let current = new Date();
        let currentYear = current.getFullYear();
        res.render("transactiondetails", {
          transactiondetailsBtn: "transactiondetailsBtn",
          customer: user,
          user: BankerId,
          transactions: user.transactionEnterys,
          fromDay: fromDay,
          toDay: toDay,
          currentYear: currentYear,
          fromDayV: "17",
          fromMonthV: "2",
          fromYearV: " ",
          toDayV: "17",
          toMonthV: "2",
          toYearV: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: "uperr",
          overviewtd: "overview",
          overviewld: "lowerr",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: "bg",
          bgld: " ",
          bged: " "
        })
      } else {
        res.render("transactiondetails", {
          transactiondetailsBtn: "transactiondetailsBtn",
          customer: user,
          user: BankerId,
          transactions: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: "uperr",
          overviewtd: "overview",
          overviewld: "lowerr",
          overviewed: " ",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: "bg",
          bgld: " ",
          bged: " "
        })
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/transactionDetails/search", (req, res) => {

  if (req.body.transtionSearchBtn === "banker") {
    var goUrlTsearch = "/transactionDetails/" + encryptText(req.body.AccountNo) + "/" + encryptText(req.body.BankerId) + "/" + req.body.fromMonth + "/" + req.body.fromDay + "/" + req.body.fromYear + "/to/" + req.body.toMonth + "/" + req.body.toDay + "/" + req.body.toYear;
  } else if (req.body.transtionSearchBtn === "customer") {
    var goUrlTsearch = "/transactionDetails/" + req.body.AccountNo + "/" + req.body.fromMonth + "/" + req.body.fromDay + "/" + req.body.fromYear + "/to/" + req.body.toMonth + "/" + req.body.toDay + "/" + req.body.toYear;
  }
  res.redirect(goUrlTsearch);
});

app.get("/transactionDetails/:AccountNo/:BankerId/:fromMonth/:fromDay/:fromYear/to/:toMonth/:toDay/:toYear", (req, res) => {
  const deRequestedAccountNo = decryptText(req.params.AccountNo);
  const BankerId = req.params.BankerId;
  db.getCustomer(deRequestedAccountNo)
    .then((user) => {
      let fromDate = req.params.fromMonth + "/" + req.params.fromDay + "/" + req.params.fromYear;
      let fromDay = dayNumber(fromDate);
      let toDate = req.params.toMonth + "/" + req.params.toDay + "/" + req.params.toYear;
      let toDay = dayNumber(toDate);
      let current = new Date();
      let currentYear = current.getFullYear();
      res.render("transactiondetails", {
        fromDayV: req.params.fromDay,
        fromMonthV: req.params.fromMonth,
        fromYearV: req.params.fromYear,
        toDayV: req.params.toDay,
        toMonthV: req.params.toMonth,
        toYearV: req.params.toYear,
        transactiondetailsBtn: "transactiondetailsBtn",
        customer: user,
        user: BankerId,
        transactions: user.transactionEnterys,
        fromDay: fromDay,
        toDay: toDay,
        currentYear: currentYear,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: "uperr",
        overviewtd: "overview",
        overviewld: "lowerr",
        overviewed: " ",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: "bg",
        bgld: " ",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});
//-------------------------------------------------loan Details------------------------------------------------
app.get("/tab/banker/:BankerId/Loandetails", (req, res) => {
  const BankerId = req.params.BankerId;
  db.getAllCustomers()
    .then((customers) => {
      res.render("loanDetails", {
        customers: customers,
        loanDetailsbtn: "allDetails",
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: "uperr",
        overviewld: "overview",
        overviewed: "lowerr",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: "bg",
        bged: " "
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })

});

app.get("/loanDetail/:urlAccountNo/:BankerId", (req, res) => {
  const requestedAccountNo = decryptText(req.params.urlAccountNo);
  const BankerId = req.params.BankerId;
  db.getCustomer(requestedAccountNo)
    .then((customer) => {
      if (customer) {
        if (customer.loanAplicationEntery[0]) {
          var totalAmountTakenkkk = parseInt(customer.loanAplicationEntery[0].sanctionAmountLoan) - parseInt(customer.loanAplicationEntery[0].totalAmountFromLoan);
        }
        res.render("loanDetails", {
          customer: customer,
          loanDetailsbtn: "loanDetailsbtn",
          user: BankerId,
          totalAmountTaken: totalAmountTakenkkk,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: "uperr",
          overviewld: "overview",
          overviewed: "lowerr",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: "bg",
          bged: " "
        })
      } else {
        res.render("loanDetails", {
          customer: customer,
          loanDetailsbtn: "loanDetailsbtn",
          user: BankerId,
          totalAmountTaken: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: "uperr",
          overviewld: "overview",
          overviewed: "lowerr",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: "bg",
          bged: " "
        })
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login")
    })
});


app.get("/loanDetail/:urlAccountNo/:BankerId/direct", (req, res) => {
  const requestedAccountNo = req.params.urlAccountNo;
  const BankerId = req.params.BankerId;
  db.getCustomer(requestedAccountNo)
    .then((customer) => {
      if (customer) {
        if (customer.loanAplicationEntery[0]) {
          var totalAmountTakenkkk = parseInt(customer.loanAplicationEntery[0].sanctionAmountLoan) - parseInt(customer.loanAplicationEntery[0].totalAmountFromLoan);
        }
        res.render("loanDetails", {
          customer: customer,
          loanDetailsbtn: "loanDetailsbtn",
          user: BankerId,
          totalAmountTaken: totalAmountTakenkkk,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: "uperr",
          overviewld: "overview",
          overviewed: "lowerr",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: "bg",
          bged: " "
        })
      } else {
        res.render("loanDetails", {
          customer: customer,
          loanDetailsbtn: "loanDetailsbtn",
          user: BankerId,
          totalAmountTaken: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: "uperr",
          overviewld: "overview",
          overviewed: "lowerr",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: "bg",
          bged: " "
        })
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});
//--------------------------------------------------emi details------------------------------------------------
app.get("/tab/banker/:BankerId/emidetails", (req, res) => {
  const BankerId = req.params.BankerId;
  db.customerWithEMI()
    .then((customers) => {
      res.render("emiDetails", {
        customers: customers,
        emiDetailsbtn: "allDetails",
        user: BankerId,
        overviewhm: " ",
        overviewcr: " ",
        overviewd: " ",
        overvieww: " ",
        overviewle: " ",
        overviewee: " ",
        overviewfd: " ",
        overviewra: " ",
        overviewfda: " ",
        overviewla: " ",
        overviewea: " ",
        overviewcd: " ",
        overviewtd: " ",
        overviewld: "uperr",
        overviewed: "overview",
        bghm: " ",
        bgcr: " ",
        bgd: " ",
        bgw: " ",
        bgle: " ",
        bgee: " ",
        bgfd: " ",
        bgra: " ",
        bgfda: " ",
        bgla: " ",
        bgea: " ",
        bgcd: " ",
        bgtd: " ",
        bgld: " ",
        bged: "bg"
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});

app.get("/emiDetail/:urlAccountNo/:BankerId", (req, res) => {
  const requestedAccountNo = decryptText(req.params.urlAccountNo);
  const BankerId = req.params.BankerId;
  db.getCustomer(requestedAccountNo)
    .then((customer) => {
      if (customer) {
        if (customer.loanAplicationEntery[0]) {
          var totalAmountTakenkk = parseInt(customer.loanAplicationEntery[0].sanctionAmountLoan) - parseInt(customer.loanAplicationEntery[0].totalAmountFromLoan);
        }
        res.render("emiDetails", {
          customer: customer,
          emiDetailsbtn: "emiDetailsbtn",
          user: BankerId,
          totalAmountTaken: totalAmountTakenkk,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: "uperr",
          overviewed: "overview",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: "bg"
        })
      } else {
        res.render("emiDetails", {
          customer: customer,
          emiDetailsbtn: "emiDetailsbtn",
          user: BankerId,
          totalAmountTaken: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: "uperr",
          overviewed: "overview",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: "bg"
        })
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("login")
    })
});

app.get("/emiDetail/:urlAccountNo/:BankerId/direct", (req, res) => {
  const requestedAccountNo = req.params.urlAccountNo;
  const BankerId = req.params.BankerId;
  db.getCustomer(requestedAccountNo)
    .then((customer) => {
      if (customer) {
        if (customer.loanAplicationEntery[0]) {
          var totalAmountTakenkk = parseInt(customer.loanAplicationEntery[0].sanctionAmountLoan) - parseInt(customer.loanAplicationEntery[0].totalAmountFromLoan);
        }
        res.render("emiDetails", {
          customer: customer,
          emiDetailsbtn: "emiDetailsbtn",
          user: BankerId,
          totalAmountTaken: totalAmountTakenkk,
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: "uperr",
          overviewed: "overview",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: "bg"
        })
      } else {
        res.render("emiDetails", {
          customer: customer,
          emiDetailsbtn: "emiDetailsbtn",
          user: BankerId,
          totalAmountTaken: " ",
          overviewhm: " ",
          overviewcr: " ",
          overviewd: " ",
          overvieww: " ",
          overviewle: " ",
          overviewee: " ",
          overviewfd: " ",
          overviewra: " ",
          overviewfda: " ",
          overviewla: " ",
          overviewea: " ",
          overviewcd: " ",
          overviewtd: " ",
          overviewld: "uperr",
          overviewed: "overview",
          bghm: " ",
          bgcr: " ",
          bgd: " ",
          bgw: " ",
          bgle: " ",
          bgee: " ",
          bgfd: " ",
          bgra: " ",
          bgfda: " ",
          bgla: " ",
          bgea: " ",
          bgcd: " ",
          bgtd: " ",
          bgld: " ",
          bged: "bg"
        })
      }
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login")
    })
});

//------------------------------------------------------------------------cutomer-----------------------------------------------------------------
//cutomer details
app.get("/tab/customer/:urlUser/home", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
  db.getCustomer(derequestedAccountNo)
    .then((user) => {
      res.render("customerHome", {
        customer: user,
        user: enrequestedAccountNo,
        fixedDiposits: user.fixedDipositEntery
      })
    })
    .catch((err) => {
      assert.isNotOk(err, 'Promise error');
      done();
      res.redirect("/login");
    })
});


//forget password
app.get("/customer/forgetpasseord", (req, res) => {
  res.render("customerSingUp", {
    otpMatch: " ",
    signUp: " ",
    updatepass: "yes"
  });
});

app.post("/forgetpassword/OtpSend", (req, res) => {
  let AccountNo = req.body.username;
      db.getCustomer( AccountNo )
       .then((user)=>{
        if (user) {
            if ( user.isCustomerOnline === "yes" ) {
              let passWord = req.body.password;
              res.render("otpCheckForSignUp", {
                AccountNo: AccountNo,
                passWord: passWord,
                OTP: user.secrateKey,
                userExist: "yes",
                passwordUpdate: "yes",
                signUp: " "
              });
            } else {
              res.redirect("/customersingup");
            }
        } else {
          res.render("otpCheckForSignUp", {
            AccountNo: AccountNo,
            userExist: "no",
            passwordUpdate: "yes",
            signUp: " "
          });
        }
        })
        .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
          res.redirect("/login")
        })
});

app.post("/forgetpassword/checkingOTP", (req, res) => {
  if (req.body.userOtp == req.body.serverOTP) {
    let accountNo = req.body.AccountNo;
    let passw = req.body.passWord;
    db.deleteUser(accountNo)
      .then((posts) => {
        db.AddUser(accountNo, passw, "customer", "no")
          .then((posts) => {
            res.render("sucessRegisted", {
              passwordUpdate: "yes",
              signUp: " "
            });
          })
          .catch((err) => {
            assert.isNotOk(err, 'Promise error');
            done();
            res.redirect("/login");
          })
      })
      .catch((err) => {
        assert.isNotOk(err, 'Promise error');
        done();
        res.redirect("/login");
      })
  } else {
    res.render("customerSingUp", {
      otpMatch: "no",
      signUp: " ",
      updatepass: "yes"
    });
  }
});

//transtion details

app.get("/tab/customer/:urlUser/transactiondetails", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
      let fromDay = 18824;
      let day = getOnlyDate();
      let toDay = dayNumber(day);
      let current = new Date();
      let currentYear = current.getFullYear();
      res.render("customertranstionDetails", {
        user: enrequestedAccountNo,
        transactions: user.transactionEnterys,
        fromDayV: "17",
        fromMonthV: "2",
        fromYearV: " ",
        toDayV: "17",
        toMonthV: "2",
        toYearV: " ",
        fromDay: fromDay,
        toDay: toDay,
        currentYear: currentYear,
      })
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
      res.redirect("/login");
      })
});

app.get("/transactionDetails/:AccountNo/:fromMonth/:fromDay/:fromYear/to/:toMonth/:toDay/:toYear", (req, res) => {
  const enrequestedAccountNo = req.params.AccountNo;
  const derequestedAccountNo = decryptText(req.params.AccountNo);
      db.getCustomer( derequestedAccountNo )
      .then((user)=>{
        let fromDate = req.params.fromMonth + "/" + req.params.fromDay + "/" + req.params.fromYear;
        let fromDay = dayNumber(fromDate);
        let toDate = req.params.toMonth + "/" + req.params.toDay + "/" + req.params.toYear;
        let toDay = dayNumber(toDate);
        let current = new Date();
        let currentYear = current.getFullYear();
        res.render("customertranstionDetails", {
          fromDayV: req.params.fromDay,
          fromMonthV: req.params.fromMonth,
          fromYearV: req.params.fromYear,
          toDayV: req.params.toDay,
          toMonthV: req.params.toMonth,
          toYearV: req.params.toYear,
          fromDay: fromDay,
          toDay: toDay,
          currentYear: currentYear,
          user: enrequestedAccountNo,
          transactions: user.transactionEnterys,
        })
       })
       .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
        res.redirect("/login");
       })
});


//money Trensfer
app.get("/tab/customer/:urlUser/moneytransfer", (req, res) => {
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
      if (user.istransfromOpen == "yes") {
        const requestedAccountNo = req.params.urlUser;
        res.render("moneyTransfer", {
          user: requestedAccountNo,
          customerGet: " ",
        })
      } else {
        const requestedAccountNo = req.params.urlUser;
        res.render("pinCreate", {
          user: requestedAccountNo,
          derequestedAccountNo: derequestedAccountNo,
          wrongOtp: " ",
          createPin: "yes",
          updatePin: " "
        })
      }
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
       res.redirect("/login")
      })
});

app.get("/moneytransfer/forgetPassword/:accountNo", (req, res) => {
  const derequestedAccountNo = decryptText(req.params.accountNo);
  const requestedAccountNo = req.params.accountNo;
  res.render("pinCreate", {
    user: requestedAccountNo,
    derequestedAccountNo: derequestedAccountNo,
    wrongOtp: " ",
    createPin: " ",
    updatePin: "yes"
  })
});

app.post("/transferCm/OtpConfrom/:user", (req, res) => {
  let AccountNo = req.body.accountNo;
     db.getCustomer( AccountNo )
     .then((user)=>{ 
      let TrPin1 = req.body.TrPin1;
      res.render("otpCheckForPin", {
        user: req.params.user,
        AccountNo: AccountNo,
        TrPin1: TrPin1,
        OTP: user.secrateKey,
      });
     })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
      res.redirect("/login");
    })
});

app.post("/transferCm/OtpCheck/:user", (req, res) => {
  if (req.body.enteredOtp == req.body.originalOtp) {
    let pin = encryptText(req.body.TrPin1)
       db.moneyTransferPinCreate( req.body.accountNo, pin )
       .then((posts)=>{
        let sucessUrl = "/transferCm/PinUpdated/" + req.params.user + "/sucessfully";
        res.redirect(sucessUrl);
        })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
        res.redirect("/login");
      })
  } else {
    let failUrl = "/tab/customer/" + req.params.user + "/moneytransfer/tryagain";
    res.redirect(failUrl);
  }
});

app.get("/tab/customer/:urlUser/moneytransfer/tryagain", (req, res) => {
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
      const requestedAccountNo = req.params.urlUser;
      res.render("pinCreate", {
        user: requestedAccountNo,
        derequestedAccountNo: derequestedAccountNo,
        wrongOtp: "yes",
        createPin: "yex",
        updatePin: " "
      })
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
       res.redirect("/login")
     })
});

app.get("/transferCm/PinUpdated/:user/sucessfully", (req, res) => {
  let reqUrl = "/tab/customer/" + req.params.user + "/moneytransfer"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});

app.post("/searchCm/transferCm", (req, res) => {
     db.getCustomer( req.body.getCt )
     .then((user)=>{
      if (user) {
        let requestedUrl = "/transfer/" + encryptText(req.body.getC) + "/" + req.body.sendC + "/send";
        res.redirect(requestedUrl);
      } else {
        let requestedUrl = "/tab/customer/" + req.body.sendC + "/moneytransfer/tryagain";
        res.redirect(requestedUrl);
      }
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
       res.redirect("/login")
      })
});

app.get("/tab/customer/:urlUser/moneytransfer/tryagain", (req, res) => {
  const requestedAccountNo = req.params.urlUser;
  res.render("moneyTransfer", {
    user: requestedAccountNo,
    customerGet: "no",
  })
});



app.get("/transfer/:urlAccG/:urlAccS/send", (req, res) => {
  const derequestedAccountNoG = decryptText(req.params.urlAccG);
  const enrequestedAccountNo = req.params.urlAccS;
  const derequestedAccountNo = decryptText(req.params.urlAccS);
     db.getCustomer( derequestedAccountNoG )
     .then((user)=>{
         db.getCustomer( derequestedAccountNo )
         .then((userk)=>{
          res.render("moneySent", {
            user: enrequestedAccountNo,
            customer: user,
            customerk: userk
          })
          })
         .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
           res.redirect("/login")
          })
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
        res.redirect("/login");
      })
});

app.post("/transfer/finalsend", (req, res) => {
  //money cut from sender
  const deAccountNos = decryptText(req.body.senderAcc)
         db.getCustomer( deAccountNos )
         .then((user)=>{
          dePin = decryptText(user.transferPIN);
          if (dePin == req.body.pin) {
          if (req.body.withdeawalFrom === "Loan") {
            let currentAmountLoan = parseInt(req.body.LoanAmount) - parseInt(req.body.geteram);
            let withdrawalFromLoan = parseInt(req.body.totalLoanAmountWithdrawal) + parseInt(req.body.geteram);
            if (currentAmountLoan >= 0) {
                   db.withdrowalFromLoan( deAccountNos, req.body.LoanAmountID, currentAmountLoan, withdrawalFromLoan )
                   .then((doc)=>{
                      let day = getOnlyDate();
                      let dayNumberk = dayNumber(day);          
                             db.TransactionDeatailsSave( deAccountNos, "BoB's Online  Banking", parseInt(req.body.geteram), currentAmountLoan, getDate() , "Online Banking" , "withdrawal Loan" , dayNumberk , "By Own" )
                             .then((foundCustomer)=>{ 
                                // money added in geter's acc
                                      db.getCustomer( req.body.geterAcc )
                                      .then((user)=>{
                                      let currentTotalAmountk = parseInt(user.currentTotalAmount) + parseInt(req.body.geteram);
                                        db.updateCurentTotalAmount( req.body.geterAcc, currentTotalAmountk )
                                           .then((posts)=>{
                                            let day = getOnlyDate();
                                            let dayNumberk = dayNumber(day);
                                                   db.TransactionDeatailsSave( req.body.geterAcc , "BoB's Online  Banking" , parseInt(req.body.geteram) , currentTotalAmountk , getDate() , "Online Banking" , "Deposit" , dayNumberk , "By Own" )
                                                   .then((foundCustomer)=>{ 
                                                    let sucessUrl = "/BoB'sAcctoAccTranstion/sucess/" + req.body.senderAcc;
                                                    res.redirect(sucessUrl);
                                                    })
                                                   .catch((err)=>{
                                                    assert.isNotOk(err,'Promise error');
                                                    done();
                                                    let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                                    res.redirect(failUrl);
                                                    })
                                          })
                                          .catch((err)=>{
                                            assert.isNotOk(err,'Promise error');
                                            done();
                                            let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                            res.redirect(failUrl);
                                           })
                                    })
                                    .catch((err)=>{
                                      assert.isNotOk(err,'Promise error');
                                      done();
                                      let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                      res.redirect(failUrl);
                                     })
                              })
                              .catch((err)=>{
                                assert.isNotOk(err,'Promise error');
                                done();
                                let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                res.redirect(failUrl);
                              })
                    })
                    .catch((err)=>{
                      assert.isNotOk(err,'Promise error');
                      done();
                      let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                      res.redirect(failUrl);
                    })
            } else {
              let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
              res.redirect(failUrl);
            }
          } else {
            let currentTotalAmount = parseInt(user.currentTotalAmount) - parseInt(req.body.geteram);
            let transtionam = parseInt(req.body.geteram);
            if (currentTotalAmount >= 500) {
                   db.updateCurentTotalAmount( deAccountNos , currentTotalAmount )
                   .then((posts)=>{
                    let day = getOnlyDate();
                    let dayNumberk = dayNumber(day);
                           db.TransactionDeatailsSave( deAccountNos, "BoB's Online  Banking", transtionam, currentTotalAmount , getDate(), "Online Banking", "withdrawal" , dayNumberk , "By Own" )
                           .then((foundCustomer)=>{ 
                              // money added in geter's acc
                                    db.getCustomer( req.body.geterAcc )
                                     .then((user)=>{
                                    let currentTotalAmountk = parseInt(user.currentTotalAmount) + parseInt(req.body.geteram);
                                    let transtionamk = parseInt(req.body.geteram);
                                         db.updateCurentTotalAmount( req.body.geterAcc , currentTotalAmountk )
                                         .then((posts)=>{
                                          let day = getOnlyDate();
                                          let dayNumberk = dayNumber(day);
                                                  db.TransactionDeatailsSave( req.body.geterAcc, "BoB's Online  Banking", transtionamk, currentTotalAmountk, getDate(), "Online Banking", "Deposit", dayNumberk , "By Own" )
                                                  .then((foundCustomer)=>{
                                                    let sucessUrl = "/BoB'sAcctoAccTranstion/sucess/" + req.body.senderAcc;
                                                    res.redirect(sucessUrl);
                                                  })
                                                  .catch((err)=>{
                                                    console.log(err);
                                                    assert.isNotOk(err,'Promise error');
                                                    done();
                                                   let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                                   res.redirect(failUrl);
                                                  })
                                        })
                                        .catch((err)=>{
                                          assert.isNotOk(err,'Promise error');
                                          done();
                                          let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                          res.redirect(failUrl);
                                         })
                                  })
                                  .catch((err)=>{
                                    assert.isNotOk(err,'Promise error');
                                    done();
                                    let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                                    res.redirect(failUrl);
                                   })
                            })
                            .catch((err)=>{
                              assert.isNotOk(err,'Promise error');
                              done();
                             let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                             res.redirect(failUrl);
                            })
                  })
                  .catch((err)=>{
                    assert.isNotOk(err,'Promise error');
                    done();
                    let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
                    res.redirect(failUrl);
                 })
            } else {
              let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
              res.redirect(failUrl);
            }
          }
        } else {
          //wrong Pin 
          let failUrl = "/BoB'sAcctoAccTranstion/pinnotmatch/" + req.body.senderAcc;
          res.redirect(failUrl);
        }
        })
        .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
          let failUrl = "/BoB'sAcctoAccTranstion/fail/" + req.body.senderAcc;
          res.redirect(failUrl);
         })
});

//wrong password
app.get("/BoB'sAcctoAccTranstion/pinnotmatch/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/moneytransfer";
  res.render("wrongPin", {
    backUrl: reqUrl
  });
});

//sucess
app.get("/BoB'sAcctoAccTranstion/sucess/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/home"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});

//fail
app.get("/BoB'sAcctoAccTranstion/fail/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/moneytransfer"
  res.render("fail", {
    backUrl: reqUrl
  });
});

//Fixed Diposit
app.get("/tab/customer/:urlUser/fd", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
      res.render("fixedDipositCustomer", {
        user: enrequestedAccountNo,
        customer: user
      });
     })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
       res.redirect("/login");
     })
});

app.post("/fixedDiposit/request/:userAcc", (req, res) => {
  db.FDApplicationEntry( req.body.fixedAmount, req.body.activeAmount, req.body.duration, getDate(), req.body.accountNo )
  .then((posts)=>{
    let Urlrequsted = "/FdRequestSend/sucess/" + encryptText(req.body.accountNo);
    res.redirect(Urlrequsted);
   })
  .catch((err)=>{
    assert.isNotOk(err,'Promise error');
    done();
    let Urlrequsted = "/FdRequestSend/fail/" + encryptText(req.body.accountNo);
    res.redirect(Urlrequsted);
  })
});

//sucess
app.get("/FdRequestSend/sucess/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/home"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});
//fail
app.get("/FdRequestSend/fail/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/fd"
  res.render("fail", {
    backUrl: reqUrl
  });
});

//loan aplication
app.get("/tab/customer/:urlUser/loanaplication", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
      res.render("loanApplication", {
        customer: user,
        user: enrequestedAccountNo
      })
      })
     .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
        res.redirect("/login");
      })
});

app.post("/loanApplication/:urlUser/applied", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
     db.loanApplicationEntry(  derequestedAccountNo, req.body.monthlyIncome, req.body.loanAmount, req.body.creditScore, req.body.FamilyIncome, req.body.loanPeriod, req.body.loanType, req.body.loanNominee, getDate(), req.body.Purpose )
     .then((posts)=>{
          let goUrl = "/loanApplicationCS/sucess/" + enrequestedAccountNo;
          res.redirect(goUrl);
      })
      .catch((err)=>{
        console.log(err);
        assert.isNotOk(err,'Promise error');
        done();
        let goUrl = "/loanApplicationCS/fail/" + enrequestedAccountNo;
        res.redirect(goUrl);
      })
});

//sucess
app.get("/loanApplicationCS/sucess/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/home"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});

//fail
app.get("/loanApplicationCS/fail/:senderAcc", (req, res) => {
  const requestedAccountNo = req.params.senderAcc;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/loanaplication"
  res.render("fail", {
    backUrl: reqUrl
  });
});

//customerEMI
app.get("/tab/customer/:user/loanemi", (req, res) => {
  const enrequestedAccountNo = req.params.user;
  const derequestedAccountNo = decryptText(req.params.user);
     db.getCustomer( derequestedAccountNo )
     .then((user)=>{
        if (user.loanAplicationEntery[0]) {
          let day1 = user.loanAplicationEntery[0].dateToCalculateIntarest;
          let day2 = getOnlyDate();
          let dayDif = DaysBitweentwoDays(day1, day2);
          dayDif = parseInt(dayDif);
          let intarestRate = user.loanAplicationEntery[0].loanIntarestRate;
          let totalWithdrawalAmount = parseInt(user.loanAplicationEntery[0].totalAmountWithdrawal);
          let r = intarestRate / 100;
          let RbyN = (r / 12) + 1;
          let t = dayDif / 365;
          let TintoN = t * 12;
          let powerget = (RbyN ** TintoN)
          let totalAmountwithIntarest = totalWithdrawalAmount * powerget;
          let intarestNow = totalAmountwithIntarest - totalWithdrawalAmount;
          let emi1t, emi2t, emi3t, emi4t, emi5t, emi6t, emi7t, emi8t, emi9t, emi10t, emi11t, emi12t, emi13t, emi14t;
          let ints1t, ints2t, ints3t, ints4t, ints5t, ints6t, ints7t, ints8t, ints9t, ints10t, ints11t, ints12t, ints13t, ints14t;
          emi1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) / 6;
          emi2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) / 12;
          emi3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) / 18;
          emi4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) / 24;
          emi5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) / 30;
          emi6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) / 36;
          emi7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) / 42;
          emi8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) / 48;
          emi9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) / 54;
          emi10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) / 60;
          emi11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) / 66;
          emi12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) / 72;
          emi13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) / 78;
          emi14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) / 84;
          ints1t = IntarestWithPeriod(totalAmountwithIntarest, r, 0.5) - totalWithdrawalAmount;
          ints2t = IntarestWithPeriod(totalAmountwithIntarest, r, 1) - totalWithdrawalAmount;
          ints3t = IntarestWithPeriod(totalAmountwithIntarest, r, 1.5) - totalWithdrawalAmount;
          ints4t = IntarestWithPeriod(totalAmountwithIntarest, r, 2) - totalWithdrawalAmount;
          ints5t = IntarestWithPeriod(totalAmountwithIntarest, r, 2.5) - totalWithdrawalAmount;
          ints6t = IntarestWithPeriod(totalAmountwithIntarest, r, 3) - totalWithdrawalAmount;
          ints7t = IntarestWithPeriod(totalAmountwithIntarest, r, 3.5) - totalWithdrawalAmount;
          ints8t = IntarestWithPeriod(totalAmountwithIntarest, r, 4) - totalWithdrawalAmount;
          ints9t = IntarestWithPeriod(totalAmountwithIntarest, r, 4.5) - totalWithdrawalAmount;
          ints10t = IntarestWithPeriod(totalAmountwithIntarest, r, 5) - totalWithdrawalAmount;
          ints11t = IntarestWithPeriod(totalAmountwithIntarest, r, 5.5) - totalWithdrawalAmount;
          ints12t = IntarestWithPeriod(totalAmountwithIntarest, r, 6) - totalWithdrawalAmount;
          ints13t = IntarestWithPeriod(totalAmountwithIntarest, r, 6.5) - totalWithdrawalAmount;
          ints14t = IntarestWithPeriod(totalAmountwithIntarest, r, 7) - totalWithdrawalAmount;
          res.render("paybackLoan", {
            customer: user,
            user: enrequestedAccountNo,
            emi1t: parseInt(emi1t),
            emi2t: parseInt(emi2t),
            emi3t: parseInt(emi3t),
            emi4t: parseInt(emi4t),
            emi5t: parseInt(emi5t),
            emi6t: parseInt(emi6t),
            emi7t: parseInt(emi7t),
            emi8t: parseInt(emi8t),
            emi9t: parseInt(emi9t),
            emi10t: parseInt(emi10t),
            emi11t: parseInt(emi11t),
            emi12t: parseInt(emi12t),
            emi13t: parseInt(emi13t),
            emi14t: parseInt(emi14t),
            ints1t: ints1t,
            ints2t: ints2t,
            ints3t: ints3t,
            ints4t: ints4t,
            ints5t: ints5t,
            ints6t: ints6t,
            ints7t: ints7t,
            ints8t: ints8t,
            ints9t: ints9t,
            ints10t: ints10t,
            ints11t: ints11t,
            ints12t: ints12t,
            ints13t: ints13t,
            ints14t: ints14t,
            totalWithdrawalAmount: parseInt(totalWithdrawalAmount),
            intarestNow: parseInt(intarestNow),
            totalAmountwithIntarest: parseInt(totalAmountwithIntarest)
          })
        } else {
          res.render("paybackLoan", {
            customer: user,
            user: enrequestedAccountNo,
          });
        }
      })
      .catch((err)=>{
        assert.isNotOk(err,'Promise error');
        done();
         res.redirect("/login");
       })
});

app.post('/loan/Onepayment/:user/apply', (req, res) => {
  const enrequestedAccountNo = req.params.user;
  const derequestedAccountNo = decryptText(req.params.user);
  let currentTotalAmount = parseInt(req.body.TotalAmount) - parseInt(req.body.totalAmountwithIntarest);
  let haveToPayK = parseInt(req.body.totalAmountwithIntarest);
  let haveToPay = parseInt(req.body.haveToPay);
  if (currentTotalAmount >= 500 && haveToPay === haveToPayK) {
         db.updateCurentTotalAmount( derequestedAccountNo, currentTotalAmount )
         .then((posts)=>{
          let day = getOnlyDate();
          let dayNumberk = dayNumber(day);
           db.TransactionDeatailsSave( derequestedAccountNo, "Cut to Clear The Full Loan Amount", parseInt(req.body.totalAmountwithIntarest), currentTotalAmount, getDate(), "Online Banking", "withdrawal", dayNumberk, "By One" )
           .then((foundCustomer)=>{
            db.deleteLoanSubDoc( derequestedAccountNo, req.body.loanId )
            .then(( customer )=>{ 
               db.deleteEmiAllApplication( derequestedAccountNo )
                .then((resultk) =>{
                  let sucessUrl = "/LoanPayment/sucess/" + enrequestedAccountNo;
                  res.redirect(sucessUrl);
                })
                .catch((err)=>{
                  assert.isNotOk(err,'Promise error');
                  done();
                  let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
                  res.redirect(failUrl);
                })
             })
            .catch((err)=>{
              assert.isNotOk(err,'Promise error');
              done();
              let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
              res.redirect(failUrl);
             })
            })
           .catch((err)=>{
            assert.isNotOk(err,'Promise error');
            done();
            let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
            res.redirect(failUrl);
            })
        })
        .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
          let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
          res.redirect(failUrl);
        })
  } else {
    let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
    res.redirect(failUrl);
  }
});

app.post("/loan/paybackPrimeAmountorIntarest/:user/apply", (req, res) => {
  const enrequestedAccountNo = req.params.user;
  const derequestedAccountNo = decryptText(req.params.user);
  let currentTotalAmount = parseInt(req.body.TotalAmount) - parseInt(req.body.primeAmount)
  if (currentTotalAmount >= 500) {
         db.updateCurentTotalAmount( derequestedAccountNo, currentTotalAmount )
         .then((posts)=>{
          let day = getOnlyDate();
          let dayNumberk = dayNumber(day);
                 db.TransactionDeatailsSave( derequestedAccountNo, "Cut to Reduce The Loan Amount", parseInt(req.body.primeAmount), currentTotalAmount, getDate(), "Online Banking", "withdrawal", dayNumberk , "By Own" )
                 .then(( foundCustomer )=>{
                  let day1 = foundCustomer.loanAplicationEntery[0].dateToCalculateIntarest;
                  let day2 = getOnlyDate();
                  let dayDif = DaysBitweentwoDays(day1, day2);
                  dayDif = parseInt(dayDif);
                  let intarestRate = foundCustomer.loanAplicationEntery[0].loanIntarestRate;
                  let totalWithdrawalAmount = parseInt(foundCustomer.loanAplicationEntery[0].totalAmountWithdrawal);
                  let r = intarestRate / 100;
                  let RbyN = (r / 12) + 1;
                  let t = dayDif / 365;
                  let TintoN = t * 12;
                  let powerget = (RbyN ** TintoN)
                  let totalAmountwithIntarest = totalWithdrawalAmount * powerget;
                  let withdrawalFromLoan = totalAmountwithIntarest - parseInt(req.body.primeAmount)
                      db.payBackLoan( derequestedAccountNo, req.body.loanId, withdrawalFromLoan, getOnlyDate() )
                      .then((dos)=>{  
                        let sucessUrl = "/LoanPayment/sucess/" + enrequestedAccountNo;
                        res.redirect(sucessUrl);
                       })
                       .catch((err)=>{
                        assert.isNotOk(err,'Promise error');
                        done();
                        let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
                        res.redirect(failUrl);
                       })
                   })
                 .catch((err)=>{
                  assert.isNotOk(err,'Promise error');
                  done();
                  let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
                  res.redirect(failUrl);
                  })
        })
        .catch((err)=>{
          assert.isNotOk(err,'Promise error');
          done();
          let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
          res.redirect(failUrl);
        })
  } else {
    let failUrl = "/LoanPayment/fail/" + enrequestedAccountNo;
    res.redirect(failUrl);
  }
});

//sucess 
app.get("/LoanPayment/sucess/:AccountNo", (req, res) => {
  const requestedAccountNo = req.params.AccountNo;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/home"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});
//fail
app.get("/LoanPayment/fail/:AccountNo", (req, res) => {
  const requestedAccountNo = req.params.AccountNo;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/loanemi"
  res.render("fail", {
    backUrl: reqUrl
  });
});

app.post("/loan/EMIentry/:urlUser/apply", (req, res) => {
  const enrequestedAccountNo = req.params.urlUser;
  const derequestedAccountNo = decryptText(req.params.urlUser);
    db.EMIapplicationEntry( req.body.branchName, derequestedAccountNo, req.body.loanPlanCode, "Auto Running EMI",  req.body.noInstallments, req.body.loanEmiAmount, getDate(), req.body.loanAdvisorName, req.body.loanNarration )
    .then((posts)=>{
          let goUrl = "/loanEMIApplicationCS/sucess/" + enrequestedAccountNo;
          res.redirect(goUrl);
     })
    .catch((err)=>{
      assert.isNotOk(err,'Promise error');
      done();
      let goUrl = "/loanEMIApplicationCS/fail/" + enrequestedAccountNo;
      res.redirect(goUrl);
    })
});

//sucess 
app.get("/loanEMIApplicationCS/sucess/:requestedAccountNo", (req, res) => {
  const requestedAccountNo = req.params.requestedAccountNo;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/home"
  res.render("sucessMsg", {
    backUrl: reqUrl
  });
});

//fail
app.get("/loanEMIApplicationCS/fail/:requestedAccountNo", (req, res) => {
  const requestedAccountNo = req.params.requestedAccountNo;
  let reqUrl = "/tab/customer/" + requestedAccountNo + "/loanemi"
  res.render("fail", {
    backUrl: reqUrl
  });
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3500;
}
app.listen(port, () => {
  console.log("server running on port 3500");
});