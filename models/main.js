/**
 * Created by doremonsun on 8/6/17.
 */
/***
 * process database
 */
const initOptions = {
    // global event notification;
    error: (error, e) => {
        if (e.cn) {
            // A connection-related error;
            //
            // Connections are reported back with the password hashed,
            // for safe errors logging, without exposing passwords.
            console.log('CN:', e.cn);
            console.log('EVENT:', error.message || error);
        }
    }
}
const connection = {
    host: 'localhost',
    port: 5432,
    database: 'fms',
    user: 'namdoremon',
    password: 2110
}
const pgp = require('pg-promise')(initOptions)
const db = module.exports = pgp(connection)

// https://www.google.com.vn/search?q=how+to+export+function+app+express+to+other+file&spell=1&sa=X&ved=0ahUKEwiDpcHh7MvVAhVKOrwKHfZFBL0QvwUIISgA&biw=1802&bih=903
// https://stackoverflow.com/questions/10090414/express-how-to-pass-app-instance-to-routes-from-a-different-file
// https://stackoverflow.com/questions/36120435/verify-database-connection-with-pg-promise-when-starting-an-app