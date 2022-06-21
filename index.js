import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import { exec, spawn } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuid } from "uuid";


const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);
console.log("directory-name 👉️", __dirname);

const app = express();
const port = 3001;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null, `${uuid()}-${file.originalname}`);
        //cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
    res.send("kljra");
});

app.post("/image-upload", upload.single("image"), (req, res) => {
    console.log("upload route (multer)");
    console.log(req.file);
    console.log(req.body.model);
    const filePath = path.join(__dirname, "uploads", req.file.filename);

    const process = spawn("python", [
        "./eval-interface-master/eval.py",
        `./uploads/${req.file.filename}`,
        "./eval-interface-master/test.tar",
        `./uploads/output-${req.file.filename}`,
    ]);
    process.stdout.on("data", function(data) {
        console.log(data.toString());
        res.status(200).json({
            message: "file uploaded and processed",
            inputUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
            outputUrl: `http://localhost:${port}/uploads/output-${req.file.filename}`,
        });
    });
    process.stderr.on("data", function(data) {
        console.log(data.toString());
        res.send(data.toString());
    });
});

app.post("/super-resolution", (req, res) => {
    let { fileName } = req.body;
    console.log(fileName);
    let outputExist = fs.readdirSync("./uploads").includes(fileName);
    if (!outputExist) {
        res.status(400).json({ message: "file doesn't exist" });
        return;
    } else {
        let srExist = fs.readdirSync("./uploads").includes(`sr-${fileName}`);
        if (srExist) {
            res.status(200).json({
                message: "file uploaded and processed",
                inputUrl: `http://localhost:${port}/uploads/${fileName}`,
                srUrl: `http://localhost:${port}/uploads/sr-${fileName}`,
            });
            return;
        }
        const process = spawn("python", [
            "./eval-interface-master/siren.py",
            `./uploads/${fileName}`,
            `./uploads/sr-${fileName}`,
        ]);
        process.stdout.on("data", function(data) {
            console.log(data.toString());
            res.status(200).json({
                message: "file uploaded and processed",
                inputUrl: `http://localhost:${port}/uploads/${fileName}`,
                srUrl: `http://localhost:${port}/uploads/sr-${fileName}`,
            });
        });
        // process.stderr.on("data", function(data) {
        //     console.log(data.toString());
        //     res.status(200).json({
        //         message: "file uploaded and processed",
        //         inputUrl: `http://localhost:${port}/uploads/${fileName}`,
        //         srUrl: `http://localhost:${port}/uploads/sr-${fileName}`,
        //     });
        // });
    }

});

app.get("/history", (req, res) => {
    let x = fs.readdirSync("./uploads").filter(file => file.includes("output-")).filter(file => !file.includes("sr-output-")).map(file => ({ outputUrl: `http://localhost:${port}/uploads/${file}`, inputUrl: `http://localhost:${port}/uploads/${file.substring(7)}` }));
    res.json(x)
})

app.listen(port, () => console.log(`server running on port: ${port}`));