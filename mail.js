require("dotenv").config();
const nodemailer = require("nodemailer");

function getDate() {
  let current = new Date();
  let cDate = current.getDate() + '-' + (current.getMonth() + 1) + '-' + current.getFullYear();
  let cTime = current.getHours() + ":" + current.getMinutes() + ':' + current.getSeconds() ;
  let dateTime = cDate + ' ' + cTime;
  return dateTime; 
}

 
function contactUs( mailID , Phnumber , message , name )
{
  let current = new Date();  
  var mailBodyToSent = `    <h3>Name</h3>
  <p style="margin-left: 20px;" >` + name + `</p>
<h3>Email ID </h3>
  <p style="margin-left: 20px;" >` + mailID + `</p>
<h3>ph number</h3>
  <p style="margin-left: 20px;" >` + Phnumber + `</p>
<h3>Message</h3>
  <p style="margin-left: 20px;" >` + message + `</p>
<h5>Date-Time</h5>
  <p style="margin-left: 20px;" >` + current + `</p>`
  
    return new Promise(function(resolve,reject){ 
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:'ranadebnath619@gmail.com',
        pass: process.env.MAILLPASS
      }
    });
    var mailOptions = {
      from: 'ranadebnath619@gmail.com',
      to: 'ranadebnath619@gmail.com',
      subject: "customer issue" ,
      html: mailBodyToSent
    };
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        console.log(" mail sending failed");
        reject(error)
      } else {
        console.log('Email sent: ' + info.response);
        resolve(info)
      }
    });
      }) 



}









function sendMail( mailId , transactionAmount , mailBody , currentAmount , mailSubject )
{ 
let current = new Date();  
var mailBodyToSent = `<div>
<p style="font-weight: 700;">Dear Customer,</p>
<br/>
<br/>
<p>Thank you for banking with <span style="font-weight: 700;">Bank Lynx</span>.</p>
<br/>
<br/>
<p>Rs. `+ transactionAmount + ` ` + mailBody + ` <span style="font-weight: 700;">Bank Lynx</span> on ` + getDate() + `. Avl Bal Rs ` + currentAmount +`. </p>
<br/>
<p>Do not disclose any confidential information such as Username, Password, OTP, etc. to anyone.</p>
<br/>
<p>Regards</p>
<br/>
<p><span style="font-weight: 700;">Bank Lynx</span></p>
<br/>
<p>© ` + current.getFullYear() + ` <span style="font-weight: 700;">Bank Lynx</span> All Rights Reserved</p>
</div>`

  return new Promise(function(resolve,reject){ 
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'ranadebnath619@gmail.com',
      pass: process.env.MAILLPASS
    }
  });
  var mailOptions = {
    from: 'ranadebnath619@gmail.com',
    to:mailId ,
    subject: mailSubject ,
    html: mailBodyToSent
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      console.log(" mail sending failed");
      reject(error)
    } else {
      console.log('Email sent: ' + info.response);
      resolve(info)
    }
  });
    })    
}



function sendMailapproval( mailId , amount )
{
let current = new Date();

var mailBodyToSent = `<div>
<p style="font-weight: 700;">Dear Customer,</p>
<br/>
<br/>
<p>Thank you for banking with <span style="font-weight: 700;">Bank Lynx</span>.</p>
<br/>
<br/>
<p>Your loan of Rs. ` + amount + ` has been approved on ` + getDate() + ` </p>
<br/>
<p>Do not disclose any confidential information such as Username, Password, OTP, etc. to anyone.</p>
<br/>
<p>Regards</p>
<br/>
<p><span style="font-weight: 700;">Bank Lynx</span></p>
<br/>
<p>©` + current.getFullYear() + ` <span style="font-weight: 700;">Bank Lynx</span> All Rights Reserved</p>
</div>`;

  return new Promise(function(resolve,reject){ 
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'ranadebnath619@gmail.com',
      pass: process.env.MAILLPASS
    }
  });
  var mailOptions = {
    from: 'ranadebnath619@gmail.com',
    to:mailId ,
    subject: 'Bank Lynx approval' ,
    html: mailBodyToSent
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      console.log(" mail sending failed");
      reject(error)
    } else {
      console.log('Email sent: ' + info.response);
      resolve(info)
    }
  });
    })    
}

function sendMailapply( mailId , applicationk )
{ 
let current = new Date();
var mailBodyToSent = `<div>
<p style="font-weight: 700;">Dear Customer,</p>
<br/>
<br/>
<p>Thank you for banking with <span style="font-weight: 700;">Bank Lynx</span>.</p>
<br/>
<br/>
<p>Your application of ` + applicationk + ` has been recoded on ` + getDate() + ` now wait for farther response .</p>
<br/>
<p>Do not disclose any confidential information such as Username, Password, OTP, etc. to anyone.</p>
<br/>
<p>Regards</p>
<br/>
<p><span style="font-weight: 700;">Bank Lynx</span></p>
<br/>
<p>© ` + current.getFullYear() + ` <span style="font-weight: 700;">Bank Lynx</span> All Rights Reserved</p>
</div>`;
  return new Promise(function(resolve,reject){ 
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'ranadebnath619@gmail.com',
      pass: process.env.MAILLPASS
    }
  });
  var mailOptions = {
    from: 'ranadebnath619@gmail.com',
    to:mailId ,
    subject: 'Bank Lynx Application' ,
    html: mailBodyToSent
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      console.log(" mail sending failed");
      reject(error)
    } else {
      console.log('Email sent: ' + info.response);
      resolve(info)
    }
  });
    })    
}


function sendMailOtp( mailId , otp )
{ 
let current = new Date();
var mailBodyToSent = `<div>
<p style="font-weight: 700;">Dear Customer,</p>
<br/>
<br/>
<p>Thank you for banking with <span style="font-weight: 700;">Bank Lynx</span>.</p>
<br/>
<br/>
<p>Your identity verification code is</p>
<h4 style = "text-align: center;">` + otp + `</h4>
<br/>
<p>Do not disclose any confidential information such as Username, Password, OTP, etc. to anyone.</p>
<br/>
<p>Regards</p>
<br/>
<p><span style="font-weight: 700;">Bank Lynx</span></p>
<br/>
<p>© ` + current.getFullYear() + ` <span style="font-weight: 700;">Bank Lynx</span> All Rights Reserved</p>
</div>`;
  return new Promise(function(resolve,reject){ 
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'ranadebnath619@gmail.com',
      pass: process.env.MAILLPASS
    }
  });
  var mailOptions = {
    from: 'ranadebnath619@gmail.com',
    to:mailId ,
    subject: 'Customer Verification' ,
    html: mailBodyToSent
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      console.log(" mail sending failed");
      reject(error)
    } else {
      console.log('Email sent: ' + info.response);
      resolve(info)
    }
  });
    })    
}

exports = module.exports={
   sendMail,
   sendMailapply,
   sendMailapproval,
   sendMailOtp,
   contactUs
} 


