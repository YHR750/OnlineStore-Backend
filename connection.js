var mysql = require('mysql2')

const conn = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'onlinestore',
    port: 3306
});

conn.connect(
    (err) => {
        if(err) throw err;
        console.log('Data base terkoneksi')
});

module.exports = conn;