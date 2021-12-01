require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { connected } = require("process");
const { match } = require("assert");
const { pipeline } = require("stream");
const { cachedDataVersionTag } = require("v8");
const { MulterError } = require("multer");
const { getDefaultSettings } = require("http2");
const saltRounds = 10;

const dbConnect = "mongodb+srv://Rana619:" + process.env.DBPASS +"@cluster0.qhggu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const connectDB = async ()=>{ 
     try{
       await mongoose.connect(dbConnect , {
        useNewUrlParser: true,
        useCreateIndex : true,
        useUnifiedTopology: true,
        useFindAndModify: false
       });
       console.log("mongoDB connected");
     } catch (err){
      assert.isNotOk(err,'Promise error');
      done();
     }
};
connectDB();

const transactionSchema = new mongoose.Schema({
    transactionTypeMoney: { type: String },
    transactionAmount: { type: Number },
    totalAmount: { type: Number },
    transactionTime: { type: String },
    transactionBranch: { type: String },
    transactiontype: { type: String },
    dayNumber: { type: Number },
    BankerId: { type: String }
  });
  const Transaction = mongoose.model("Transaction", transactionSchema);
  const fixedDipositSchema = new mongoose.Schema({
    primeAmount: { type: Number },
    finalAmount: { type: Number },
    startingDate: { type: String },
    maturitiyDate: { type: String },
    BankerId: { type: String }
  })
  const FixedDeposit = mongoose.model("FixedDiposit", fixedDipositSchema);
  const fixedDipositCSSchema = new mongoose.Schema({
    primeAmount: { type: Number },
    TotalAmount: { type: Number },
    duration: { type: Number },
    Datego: { type: String },
    accountNo: { type: String },
  })
  const FixedCSDeposit = mongoose.model("FixedCSDiposit", fixedDipositCSSchema);
  const loanAplicationSchema = new mongoose.Schema({
    monthlyIncome: { type: Number },
    loanAmount: { type: Number },
    creditScore: { type: Number },
    sanctionAmountLoan: { type: Number },
    loanPeriod: { type: Number },
    EmiStatrtLastDate: { type: String },
    loanType: { type: String },
    loanNominee: { type: String },
    loanIntarest: { type: Number },
    loanIntarestRate: { type: Number },
    totalAmountFromLoan: { type: Number },
    totalAmountWithdrawal: { type: Number },
    dateToCalculateIntarest: { type: String },
    dateLoanTake: { type: String },
    BankerId: { type: String }
  })
  const LoanAplication = mongoose.model("LoanAplication", loanAplicationSchema);
  const loanAplicationCSSchema = new mongoose.Schema({
    AccountNo: { type: String },
    monthlyIncome: { type: Number },
    loanAmount: { type: Number },
    creditScore: { type: Number },
    FamilyIncome: { type: Number },
    loanPeriod: { type: Number },
    loanType: { type: String },
    loanNominee: { type: String },
    dateOfApplication: { type: String },
    Purpose: { type: String }
  })
  const LoanAplicationCS = mongoose.model("LoanAplicationCS", loanAplicationCSSchema);
  const loanEMISchema = new mongoose.Schema({
    branchName: { type: String },
    loanAccountNumber: { type: String },
    loanPlanCode: { type: String },
    loanPaymentMode: { type: String },
    noInstallments: { type: Number },
    totalPayable: { type: Number },
    loanEmiAmount: { type: Number },
    emiStartDate: { type: String },
    isEmiruning: { type: String },
    BankerId: { type: String },
    dateIntarestCalculate: { type: String },
    loanAdvisorName: { type: String }
  })
  const LoanEmi = mongoose.model("LoanEmi", loanEMISchema);
  const loanEMICSSchema = new mongoose.Schema({
    branchName: { type: String },
    loanAccountNumber: { type: String },
    loanPlanCode: { type: String },
    loanPaymentMode: { type: String },
    noInstallments: { type: Number },
    loanEmiAmount: { type: Number },
    applyDate: { type: String },
    loanAdvisorName: { type: String },
    Narration: { type: String }
  })
  const LoanEmiCS = mongoose.model("LoanEmiCS", loanEMICSSchema);
  const customerSchema = new mongoose.Schema({
    //initial member creation form
    userfName: { type: String },
    usermName: { type: String },
    userlName: { type: String },
    ffName: { type: String },
    fmName: { type: String },
    flName: { type: String },
    currentTotalAmount: { type: Number },
    AccountNo: { type: String },
    IFCcode: { type: String },
    gender: { type: String },
    marriageStatus: { type: String },
    address: { type: String },
    phone: { type: String },
    pin: { type: String },
    panNo: { type: String },
    voter: { type: String },
    adhar: { type: String },
    email: { type: String },
    dob: { type: String },
    occupation: { type: String },
    accountType: { type: String },
    nominiName: { type: String },
    nominiRelationship: { type: String },
    isAnyFixedDiposit: { type: String },
    isAnyEMIrunning: { type: String },
    isCustomerOnline: { type: String },
    istransfromOpen: { type: String },
    transferPIN: { type: String },
    BankerId: { type: String },
    passportSizePhoto:
    {
      data: Buffer,
      contentType: String
    },
    SignatureImg:
    {
      data: Buffer,
      contentType: String
    },
    fixedDipositEntery: [fixedDipositSchema],
    transactionEnterys: [transactionSchema],
    loanAplicationEntery: [loanAplicationSchema],
    loanEMIEntery: [loanEMISchema]
  });
  const Customer = mongoose.model("Customer", customerSchema);
  
  const adminSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    userType: { type: String }
  });
  const Admin = new mongoose.model("Admin", adminSchema);


function userRegister( userID , userPass, userType ){
    return new Promise(function(resolve,reject){
        bcrypt.hash( userPass, saltRounds, (err, hash) => {
          if(!err){
            const newUser = new Admin({
              username: userID,
              password: hash,
              userType: userType
            });
            newUser.save((err) => {
              if (err) {
                 reject(err);
              } else {
                 resolve();
              }
            })
        }
        });
    })
}

function getUser( username, userType ){
    return new Promise(function(resolve,reject){
         Admin.findOne({ username: username, userType: userType  }, (err, user) => {
          if (!err) {
            resolve(user)
          } else{
            reject(err)
          }
        })
    })
}

function deleteUser( accountNo ){
    return new Promise(function(resolve,reject){
      Admin.deleteOne({ username: accountNo }, (err) => {
         if(err)
         {
            reject(err)
         } else {
           resolve()
         }
      })
    })
}

function getCustomer( AccountNo ){
    return new Promise(function(resolve,reject){
        Customer.findOne({ AccountNo: AccountNo }, (err, user) => {
           if(err){
               reject(err)
           } else {
               resolve(user)
           }
        })
    })
}

function getAllCustomers(){
    return new Promise(function(resolve,reject){
        Customer.find((err, users) => {
           if(err){
               reject(err)
           } else {
               resolve(users)
           }
        })
    })
}



function updateCustomerOnlineStatus( accountNo ){
    return new Promise(function(resolve,reject){
        Customer.updateOne({ AccountNo: accountNo }, { isCustomerOnline: "yes" }, (err) => {
            if (err) {
               reject(err) 
            } else {
               resolve()
            }
          }); 
    })
}

function getAllcustomersWithFD(){
    return new Promise(function(resolve,reject){
        Customer.find({ isAnyFixedDiposit: "Yes" }, (err, docs) => {
            if(err){
                reject(err)
            }
            else{  
                resolve(docs) 
            }
        })
    })
}

function getAllcustomersWithEMI(){
    return new Promise(function(resolve,reject){
        Customer.find({ isAnyEMIrunning: "yes" }, (err, docs) => {
            if (!err) {
                 resolve(docs)
            }else{
                reject(err)
            }
        })
    })
}


function updateCurentTotalAmount( accountNo , currentTotalAmount ){
    return new Promise(function(resolve,reject){
        Customer.updateOne({ AccountNo: accountNo }, { currentTotalAmount: currentTotalAmount }, (err) => {
            if(err){
                reject(err)
            }
            else{  
                resolve() 
            }
        })
    })
}

function TransactionDeatailsSave( accountNok , transactionTypeMoneyk , transactionAmountk , totalAmountk , transactionTimek , transactionBranchk , transactiontypek , dayNumberk , BankerIdk ){
    return new Promise(function(resolve,reject){
        const Deposit = new Transaction({
            transactionTypeMoney: transactionTypeMoneyk ,
            transactionAmount: transactionAmountk,
            totalAmount: totalAmountk ,
            transactionTime: transactionTimek ,
            transactionBranch: transactionBranchk ,
            transactiontype: transactiontypek ,
            dayNumber: dayNumberk,
            BankerId: BankerIdk
          });
          Customer.findOne({ AccountNo: accountNok }, (err, foundCustomer) => {
            if (!err) {
              foundCustomer.transactionEnterys.push(Deposit);
              foundCustomer.save((err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(foundCustomer) 
                }
            });
          } else {
            reject(err)
          }
        });
    })
}
function delateFDSubdoc( accountNo , FixID ){
    return new Promise(function(resolve,reject){
        Customer.findOneAndUpdate({ AccountNo: accountNo },
            { $pull: { fixedDipositEntery: { _id: FixID } } }, (err, getk) => {
              if (!err) {
                 resolve()
              } else {
                 reject(err)
              }
            })
    })
}

function delateEMISubdoc( accountNo , emiId ){
    return new Promise(function(resolve,reject){
        Customer.findOneAndUpdate({ AccountNo: accountNo },
            { $pull: { loanEMIEntery: { _id: emiId } } }, (err, getk) => {
              if (!err) {
                  resolve()
              } else {
                  reject(err)
              }  
              })
    })
}

function updateAnyfixedIsHere( accountNo ){
    return new Promise(function(resolve,reject){
        Customer.updateOne({ AccountNo: accountNo }, { isAnyFixedDiposit: "no" }, (err) => {                   
            if (!err) {
                reject(err);
            } else {
                resolve();
            }
          })
    })
}

function updateRunningEMI( accountNo, emiId, totalPayable, dateIntarestCalculate, noInstallments ){
    return new Promise(function(resolve,reject){

        Customer.findOneAndUpdate(
            { "AccountNo": accountNo, "loanEMIEnterys._id": emiId },
            {
              "$set": {
                "loanEMIEnterys.$.totalPayable": totalPayable,
                "loanEMIEnterys.$.dateIntarestCalculate": dateIntarestCalculate,
                "loanEMIEnterys.$.noInstallments": noInstallments,
              }
            },
            function (err, doc) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
        });
    })
}

function newCustomerEntry( userfNamek, usermNamek, userlNamek, ffNamek, fmNamek, flNamek, genderk, marriageStatusk, addressk, phonek, pink, panNok, voterk, adhark, emailk, dobk, occupationk, accountTypek, nominiNamek, nominiRelationshipk, BankerIdk, passportSizePhotok, SignatureImgk ){
    return new Promise(function(resolve,reject){
        let InitialAccountNo = 9050114588;
        var AccountNumber;
        Customer.countDocuments().then((count_documents) => {
            let newAccountNumber = InitialAccountNo + count_documents + 1;
            AccountNumber = "000" + newAccountNumber.toString();
            let currentAmount = 0;
            const newCustomer = {
              userfName: userfNamek,
              usermName: usermNamek,
              userlName: userlNamek,
              ffName: ffNamek,
              fmName: fmNamek,
              flName: flNamek,
              AccountNo: AccountNumber,
              currentTotalAmount: currentAmount,
              IFCcode: "RCBK0000078",
              gender: genderk,
              marriageStatus: marriageStatusk,
              address: addressk,
              phone: phonek,
              pin: pink,
              panNo: panNok ,
              voter: voterk,
              adhar: adhark,
              email: emailk,
              dob: dobk,
              occupation: occupationk,
              accountType: accountTypek,
              nominiName: nominiNamek,
              nominiRelationship: nominiRelationshipk,
              isAnyFixedDiposit: "no",
              isAnyEMIrunning: "no",
              isCustomerOnline: "no",
              istransfromOpen: "no",
              transferPIN: " ",
              BankerId: BankerIdk,
              passportSizePhoto:
              {
                data: passportSizePhotok,
                contentType: 'passportSizePhoto/png'
              },
              SignatureImg:
              {
                data:  SignatureImgk,
                contentType: 'Signature/png'
              },
            }
              Customer.create(newCustomer, (err, item) => {
                if (err) {
                    reject(err)
                }
                else {
                  resolve(item)
                }
              });
         
          }).catch((err) => {
              reject(err);
          })
    })
}

function withdrowalFromLoan( deRequestedAccountNo, loanId, currentAmountLoan, withdrawalFromLoan ){
  return new Promise(function(resolve,reject){
    Customer.findOneAndUpdate(
      { "AccountNo": deRequestedAccountNo, "loanAplicationEntery._id": loanId },
      {
        "$set": {
          "loanAplicationEntery.$.totalAmountFromLoan": currentAmountLoan,
          "loanAplicationEntery.$.totalAmountWithdrawal": withdrawalFromLoan,
        }
      },
      function (err, doc) {
        if(err)
        {
          reject(err)
        } else {
          resolve(doc)
        }
      })
  })
}

function loanApllicationDelete( applicationID ){
  return new Promise(function(resolve,reject){
    LoanAplicationCS.deleteOne({ _id: applicationID }, (err) => {
      if (!err) {
          resolve()
      } else {
          reject(err)
      }
    });
  })
}

function loanDataEntry( accountNo, monthlyIncomek, loanAmounk, creditScorek, sanctionAmountLoank, loanPeriodk, EmiStatrtLastDatek, loanTypek, loanNomineek, loanIntarestk, loanIntarestRatek, totalAmountFromLoank, totalAmountWithdrawalk, dateToCalculateIntarestk, dateToCalculateIntarestk,  BankerIdk ){
  return new Promise(function(resolve,reject){
    loanEntry = new LoanAplication({
      monthlyIncome: monthlyIncomek,
      loanAmount: loanAmounk,
      creditScore: creditScorek,
      sanctionAmountLoan: sanctionAmountLoank,
      loanPeriod: loanPeriodk,
      EmiStatrtLastDate: EmiStatrtLastDatek,
      loanType: loanTypek,
      loanNominee: loanNomineek,
      loanIntarest: loanIntarestk, 
      loanIntarestRate: loanIntarestRatek, 
      totalAmountFromLoan: totalAmountFromLoank, 
      totalAmountWithdrawal: totalAmountWithdrawalk, 
      dateToCalculateIntarest: dateToCalculateIntarestk, 
      dateLoanTake: getDate(),  
      BankerId: BankerIdk
    })
      Customer.findOne({ AccountNo: accountNo }, (err, foundCustomer) => {
        if (!err) {
          foundCustomer.loanAplicationEntery.push(loanEntry);
          foundCustomer.save((err) => {
             if(err)
             {
               reject(err)
             } else {
               resolve(foundCustomer)
             }
          })
        } else {
            reject(err)
        }
          })
  })
}

function deleteEMIApplication( applicationID ){
  return new Promise(function(resolve,reject){
    LoanEmiCS.deleteOne({ _id: applicationID }, (err) => {
      if (!err) {
          reject(err)
      } else {
          resolve()
      }
    });
  })
}

function totalAmountWithStartEMI( accountNo, currentTotalAmount ){
  return new Promise(function(resolve,reject){
    Customer.updateOne({ AccountNo: accountNo }, { currentTotalAmount: currentTotalAmount, isAnyEMIrunning: "yes" }, (err) => {
      if(err){
          reject(err)
      }
      else{  
          resolve() 
      }
  })
  })
}

function EMIDataEntry( accountNo, branchNamek, loanAccountNumberk, loanPlanCodek, loanPaymentModek, noInstallmentsk, totalPayablek, loanEmiAmountk, emiStartDatek, isEmiruningk, BankerIdk, dateIntarestCalculatek, loanAdvisorNamek ){
  return new Promise(function(resolve,reject){
    const newLoanEmi = new LoanEmi({
      branchName: branchNamek, 
      loanAccountNumber: loanAccountNumberk, 
      loanPlanCode: loanPlanCodek,
      loanPaymentMode: loanPaymentModek, 
      noInstallments: noInstallmentsk, 
      totalPayable: totalPayablek, 
      loanEmiAmount: loanEmiAmountk, 
      emiStartDate: emiStartDatek, 
      isEmiruning: isEmiruningk, 
      BankerId: BankerIdk, 
      dateIntarestCalculate: dateIntarestCalculatek,
      loanAdvisorName: loanAdvisorNamek 
    });
      Customer.findOne({ AccountNo: accountNo }, (err, foundCustomer) => {
        if (!err) {
          foundCustomer.loanEMIEntery.push(newLoanEmi);
          foundCustomer.save((err) => {
            if(err){
               reject(err)
            } else {
               resolve(foundCustomer)
            }
          });
        } else {
             reject(err)
        }
      });
  })
}

function deleteLoanSubDoc( accountNo, subDocID ){
  return new Promise(function(resolve,reject){
    Customer.findOneAndUpdate({ AccountNo: accountNo },
      { $pull: { loanAplicationEntery: { _id: subDocID } } }, (err, customer) => {
        if (!err) {
            resolve(customer)
        } else {
            reject(err)
        }
      });
  })
}

function deleteFDApplication( applicationID ){
  return new Promise(function(resolve,reject){
    FixedCSDeposit.deleteOne({ _id: applicationID }, (err) => {
      if (!err) {
        resolve()
      } else {
        reject(err)
      }
    })
  })
}

function customerWithEMI( ){
  return new Promise(function(resolve,reject){
  Customer.find({ isAnyEMIrunning: "yes" }, (err, customers) => {
     if(err)
      {
        reject(err)
      } else {
        resolve(customer)
      }
  })
  })
}

function payBackLoan( accountNo, loanId, withdrawalFromLoan, datek ){
  return new Promise(function(resolve,reject){
    Customer.findOneAndUpdate(
      { "AccountNo": accountNo, "loanAplicationEntery._id": loanId },
      {
        "$set": {
          "loanAplicationEntery.$.totalAmountWithdrawal": withdrawalFromLoan,
          "loanAplicationEntery.$.dateToCalculateIntarest": datek
        }
      },
      function (err, doc) {
       if(err)
        {
          reject(err);
        }
      else{
        resolve(doc)
      }
      })
  })
}

function isAnyFbStatusWithTotalAmount( accountNo, currentTotalAmount,  ){
  return new Promise(function(resolve,reject){
    Customer.updateOne({ AccountNo: deRequestedAccountNo }, { currentTotalAmount: currentTotalAmount, isAnyFixedDiposit: "Yes" }, (err) => {
      if(err){
         reject(err);
      } else {
         resolve()
      }
    })
  })
}

function fixedDipositEntery( accountNo, primeAmountk, finalAmountk, startingDatek, maturitiyDatek, BankerIdk ){
  return new Promise(function(resolve,reject){
    const fixedDiposit = new FixedDeposit({  
      primeAmount: primeAmountk,
      finalAmount: finalAmountk,
      startingDate: startingDatek,
      maturitiyDate: maturitiyDatek,
      BankerId: BankerIdk
    });
    Customer.findOne({ AccountNo: accountNo }, (err, foundCustomer) => {
        if (!err) {
          foundCustomer.fixedDipositEntery.push(fixedDiposit);
          foundCustomer.save((err) => {
             if(err){
                reject(err)
             } else {
                resolve(foundCustomer)
             }
          })
        } else {
             reject(err)
        }
      })
  })
}

function allFDApplications( ){
  return new Promise(function(resolve,reject){
    FixedCSDeposit.find((err, applications) => {
      if(err)
      {
        reject(err)
      } else {
        resolve(applications)
      }
    })
  })
}

function fDApplication( accountNo ){
  return new Promise(function(resolve,reject){
    FixedCSDeposit.find({ accountNo: accountNo }, (err, applications) => {
       if(err)
       {
          reject(err)
       } else {
          resolve(applications)
       }
    })
  })
}

function allLoanApplication( ){
  return new Promise(function(resolve,reject){
    LoanAplicationCS.find((err, applications) => {
      if(err)
      {
          reject(err)
      } else {
          resolve(applications)
      }
    })
  })
}

function loanApplication( accountNo ){
  return new Promise(function(resolve,reject){
    LoanAplicationCS.find({ AccountNo: accountNo }, (err, application) => {
      if(err){
             reject(err)
      } else {
        resolve(application)
      }
    })
  })
}

function loanApplicationByID( loanApplicationID ){
  return new Promise(function(resolve,reject){
    LoanAplicationCS.findOne({ _id: loanApplicationID }, (err, application) => {
      if (!err) {
          resolve(application)
      } else{
          reject(err)
      }
     })
  })
}

function allEMIApplications( ){
  return new Promise(function(resolve,reject){
    LoanEmiCS.find((err, applications) => {
       if(err)
       {
         reject(err)
       } else {
         resolve(applications)
       }
    })
  })
}

function EMIApplication( accountNo ){
  return new Promise(function(resolve,reject){
    LoanEmiCS.find({ loanAccountNumber: accountNo }, (err, applications) => {
         if(err)
         {
           reject(err)
         } else {
           resolve(applications)
         }
    })
  })
}

function EMIApplicationByID( loanApplicationID ){
  return new Promise(function(resolve,reject){
    LoanEmiCS.findOne({ _id: loanApplicationID }, (err, application) => {
     if(err)
     { 
       reject(err)
     } else {
       resolve(application)
     }
    })
  })
}

function moneyTransferPinCreate( accountNo , pin ){
  return new Promise(function(resolve,reject){
  Customer.updateOne({ AccountNo: accountNo }, { transferPIN: pin, istransfromOpen: "yes" }, (err) => {
     if(err)
       {
         reject(err)
       } else {
        resolve()
       }
  })
  })
}

function FDApplicationEntry(  primeAmountk, TotalAmountk, durationk, Dategok, accountNok ){
  return new Promise(function(resolve,reject){
    const Fixed = new FixedCSDeposit({
      primeAmount: primeAmountk,
      TotalAmount: TotalAmountk,
      duration: durationk,
      Datego: Dategok,
      accountNo: accountNok
    })
    Fixed.save((err) => {
        if (!err) {
             resolve()
        } else {
            reject(err)
        }
      })
  })
}

function loanApplicationEntry(  AccountNok, monthlyIncomek, loanAmountk, creditScorek, FamilyIncomek, loanPeriodk, loanTypek, loanNomineek, dateOfApplicationk, Purposek ){
  return new Promise(function(resolve,reject){
    const loanApplication = new LoanAplicationCS({
      AccountNo:  AccountNok,
      monthlyIncome: monthlyIncomek,
      loanAmount: loanAmountk,
      creditScore: creditScorek,
      FamilyIncome: FamilyIncomek,
      loanPeriod: loanPeriodk,
      loanType: loanTypek,
      loanNominee: loanNomineek,
      dateOfApplication: dateOfApplicationk,
      Purpose: Purposek
    });
    loanApplication.save((err) => {
        if (err) {
           resolve(err);
        } else {
           reject()
        }
      });
  })
}

function EMIapplicationEntry( branchNamek, loanAccountNumberk, loanPlanCodek,  loanPaymentModek, noInstallmentsk, loanEmiAmountk, applyDatek,  loanAdvisorNamek, Narrationk ){
  return new Promise(function(resolve,reject){
    const EMIApplication = new LoanEmiCS({
      branchName:  branchNamek,
      loanAccountNumber: loanAccountNumberk,
      loanPlanCode: loanPlanCodek,
      loanPaymentMode: loanPaymentModek,
      noInstallments: noInstallmentsk,
      loanEmiAmount: loanEmiAmountk,
      applyDate: applyDatek,
      loanAdvisorName: loanAdvisorNamek,
      Narration: Narrationk
    });
   EMIApplication.save((err) => {
     if(err)
      {
         reject(err)
      } else {
         resolve()
      }
   })
  })
}


exports = module.exports={
    getAllcustomersWithFD,
    updateCurentTotalAmount,
    TransactionDeatailsSave,
    delateFDSubdoc,
    updateAnyfixedIsHere,
    getAllcustomersWithEMI,
    updateRunningEMI,
    delateEMISubdoc,
    userRegister,
    getUser,
    getCustomer,
    updateCustomerOnlineStatus,
    newCustomerEntry,
    withdrowalFromLoan,
    loanApllicationDelete,
    loanDataEntry,
    deleteEMIApplication,
    totalAmountWithStartEMI,
    EMIDataEntry,
    deleteLoanSubDoc,
    payBackLoan,
    deleteFDApplication,
    isAnyFbStatusWithTotalAmount,
    fixedDipositEntery,
    getAllCustomers,
    customerWithEMI,
    allFDApplications,
    fDApplication,
    allLoanApplication,
    loanApplication,
    loanApplicationByID,
    allEMIApplications,
    EMIApplication,
    EMIApplicationByID,
    deleteUser,
    moneyTransferPinCreate,
    FDApplicationEntry,
    EMIapplicationEntry,
    loanApplicationEntry
} 