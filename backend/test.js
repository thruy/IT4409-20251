const mongoose = require("mongoose");

mongoose
    .connect("mongodb+srv://20225191:20225191@cluster.zn1axnp.mongodb.net/it4409?retryWrites=true&w=majority&appName=Cluster")
    .then(() => console.log("OK"))
    .catch((err) => console.log("ERR:", err));
// test thu, khong lien quan den server