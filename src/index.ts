import { connectDB } from "./db/index"
import { app } from "./app"

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`💫 Server is running on port : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("Mongo db connection failed !!!", err)
    })
