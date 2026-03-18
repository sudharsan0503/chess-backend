const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path=require("path");
const { title } = require("process");

const app = express();// express handles routing,middleware
const server = http.createServer(app); //socket requires http server so we create like this

const io=socket(server);

const chess = new Chess();

let players={};
let currentPlayer='W';

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{ //dynamic rending - sending data+html file
    res.render("index",{title:"Custom chess game"});
});

io.on("connection",function(uniquesocket){
    console.log("connected");
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole");
    }

    //for understanding of socket, below and chessgame.js are commented
    // uniquesocket.on("churan",()=>{
    //     io.emit("churan paapdi");
    // });

    uniquesocket.on("disconnect",function(){
       console.log("disconnected");
       if(uniquesocket.id===players.white){
        delete players.white;
       }else if(uniquesocket.id===players.black){
        delete players.black;
       }
    });

    uniquesocket.on("move",(move)=>{
       try {
         if(chess.turn()==='w' && uniquesocket.id !== players.white) return;
         if(chess.turn()==='b' && uniquesocket.id !== players.black) return;
         const result = chess.move(move);
         if(result){
            currentPlayer=chess.turn();
            io.emit("move",move);
            io.emit("boardState",chess.fen(2))
         }
         else{
            console.log("Invalid move:", move);
            uniquesocket.emit("invalidMove",move);
         }
       } catch (error) {
           console.log(error);
           uniquesocket.emit("invalidMove",move);
       }
    });
});

server.listen(3000,function(){
  console.log("Listening on port 3000\n");
});