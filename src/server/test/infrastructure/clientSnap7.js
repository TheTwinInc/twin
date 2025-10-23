// var snap7 = require('node-snap7');

// var S7Client = snap7.S7Client;
 
// var s7client = new snap7.S7Client();

// function parser(bFn, buffer, offset = 0) {
//     buffer['read'+bFn](offset);  
// } 

// s7client.ConnectTo('192.168.10.51', 0, 1, function(err) {
//     let areaDb = 132;
//     // let areaDb = S7Client.S7AreaDB;
//     // var wordLen = s7client.S7Client.S7WLDWord;
//     let wordLen = 4;
//     if(err)
//         return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
 
//     // Read the first byte from PLC process outputs...
//     s7client.ABRead(0, 1, function(err, res) {
//         if(err)
//             return console.log(' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
 
//         // ... and write it to stdout
//         console.log(res)
//     });

//     // s7client.ReadArea(snap7.Area.S7AreaDB, 3, 0, 1, , function(err) {
//     // s7client.DBRead(areaDb, 3, 0, 1, wordLen, function(err, res) {
//     s7client.DBRead(3, 0, 4, function(err, res) {
//         if(err)
//             return console.log(' >> ReadArea failed. Code #' + err + ' - ' + s7client.ErrorText(err));
 
//         // ... and write it to stdout
//         console.log(res)
//     });
// });