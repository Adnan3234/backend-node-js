import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
import { connectDB } from './db/index.js'
import { app } from './app.js'



connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is listening on ${process.env.PORT}`)
    })

    app.on('error', (error) => {
        console.log('Express server error: ' + error)
        throw error
    })
}).catch((err) => {
    console.log('MongoDB connection error: ' + err)
})




/*
IIFE -> imediatelely invoked function expression

;(async()=>{
    try {
        const dbConnection = await mongoose.connect(`${process.env.DB_CONNECTION}/${DB_NAME}`);
        console.log(dbConnection.connection);


    } catch (error) {
        throw error
        // console.log('Connection Error--',error.message)
        // throw new Error('Connection Error--',error.message)
    }
})()



*/

// main().catch(err => console.log(err));
// async function main() {
//     let mdb = await mongoose.connect(`${process.env.DB_CONNECTION}`);
//     console.log(mdb.connection, '-mdb---')
//     // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
// }