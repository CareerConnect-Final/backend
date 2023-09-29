'use strict';

module.exports = () => {

  return (req, res, next) => {
    console.log("-------------------------------->",req.user.role)
    try {
      if (req.user.role==="company"||req.user.role==="superadmin") {
       
        next();
      }
      else {
        next('Access Denied');
      }
    } catch (e) {
      next('Invalid Login');
    }

  }

}
