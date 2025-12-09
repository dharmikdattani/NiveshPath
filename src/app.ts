import Express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler.middleware";
import routes from "././routes/index.route"

const app = Express()

app.use(cors())
app.use(Express.json({ limit: "16kb" }))
app.use(Express.urlencoded({ limit: "16kb" }))
app.use(cookieParser())

app.get("/ping", (req, res) => {
    res.send("Endpoint is working")
})

app.use("/v1/api/", routes)

app.use(errorHandler)

export { app }