const errorHandler = (err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({msg: 'Something went wrong, please try again'});  
}

module.exports = errorHandler;