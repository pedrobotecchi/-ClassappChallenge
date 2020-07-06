/*
    Classapp Challenge
    Writen by Pedro Henrique Botecchi -2020
*/

/****************
    Modules
*****************/
const fs = require('fs'); // Read from the file system
const csv = require("fast-csv");
const _ = require('lodash');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

/****************
    FILES
*****************/
const INPUT = './input.csv';
const OUTPUT = './output.json';

var dataInput = [];
var dataOutput = [];

fs.createReadStream(INPUT)                        // Read INPUT and set a stream to read the data
    .pipe(csv.parse({ headers: false }))
    .on('error', error => console.error(error))
    .on('data', function(data){
        dataInput.push(data)                      // While I can still read data, push it to dataInput matrix 
    })
    .on('end', function(){                        // When there's no more data to read, call formatDataCsv2JSON
        fomatDataCsv2JSON(dataInput)
    })

/***************************************************************************************
    Function that formats an read CSV file and coverts it into and given JSON format
****************************************************************************************/
function fomatDataCsv2JSON(dataInput){
    /****************
        VAR SECTION
    *****************/
        var header = dataInput[0]          // This VAR helds the first line of the file (the header)       
        var dataRows = dataInput.slice(1)  // Helds the input entries from input

        var newHeader = []                 // This VAR helds the new header, already organized
        var count = 0                      // Auxiliary var that controls newHeader insertion
    
        console.log("HEADER : ",header)
    /*
        This loop organizes newHeader following some criterias.
        It sweeps header, searching for fields in header that have " " on it i.e email Responsável, Pai
        and put each word found this way in a vector, helping putting the fields "tags" correctly 
    */
    for(i = 0;i < header.length ;i++){
        var words = header[i].split(' ')
        var aux = []
        if(words.length != 1){          
            if(header[i][0] != " "){
                aux.push(words[0])
                for(j=1; j<words.length ; j++)
                    aux.push(words[j])
                newHeader.push(aux)
                count++
            }
            else{
                newHeader[count-1] = _.concat(newHeader[count-1],words[1])
            }
        }
        else{
            newHeader.push(header[i])
            count++
        }
    }

    /* 
        Now that is organized in Tags and Subtags I will check for duplicated fields and save the index of it, this helps to
        prevent columns change of the field "class"
    */
    var indexes = []    // This var helds the position of the fields class
    for(i = 0; i<newHeader.length;i++){
        for(j=i+1; j<newHeader.length; j++){
            if(newHeader[i] == newHeader[j]){
                indexes.push(i)
                indexes.push(j)
            }
        }
    }

    var index;

    // This look check the data and insert into an object
    for(i = 0; i< dataRows.length; i++){
        // Checking for existing inserted data
        var obj = {}
        var j = 0
        var flag = true

        /*
            This find try to catch the eid of the inserted data to check if it was already inserted or not
            If it was, index saves the position returned by findIndex
        */
        index = _.findIndex(dataOutput,['eid', dataRows[i][1]])
        console.log("j = ",index)
        if(index != -1)
            flag = false;
        
        var addresses = []        // This VAR holds the addresses field in output.JSON
        // For each entry in INPUT file :
        for(k=0; k<newHeader.length; k++){
            // Check if newHeader's entry is a matrix. like ["email","Responsavel","Pai"]
            if(Array.isArray(newHeader[k])){   
                var listAddress = {}        // This var holds the address value
                
                if(newHeader[k][0] === "email"){

                    var emails = dataRows[i][k].split('/')  // Split the field to catch multiple emails inserted
                    var countEmail = 0                      // Hold the emails matrix index, helping to check if it's email is valid
                    do{
                        listAddress = {}
                        if(verifyEmail(emails[countEmail])){
                            listAddress["type"] = newHeader[k][0]        // Type receive only the first item
                            // This for cleans the ',' beetwen tags
                            for(n=1;n<(newHeader[k].length)-1;n++) newHeader[k][n] = newHeader[k][n].slice(0,(newHeader[k][n].length-1))
                            listAddress["tags"] = _.drop(newHeader[k])   // Tags receive the rest
                            listAddress["address"] = emails[countEmail]  // address receive the input value
                        }

                        if(Object.keys(listAddress).length != 0)         // If it's a valid address, insert into addresses matrix
                            addresses.push(listAddress)
                        
                        countEmail++                                     // Increment countEmail to go to the next email in emails
                    }while(countEmail<emails.length);
                }
                else{ 
                    // It's a phone then treat similarly to email's part 
                    listAddress = {}
                    try{
                        // Try to validate the Phone number using google-libphonenumber
                        const number = phoneUtil.parseAndKeepRawInput(dataRows[i][k], 'BR');
                        if(phoneUtil.isValidNumberForRegion(number,'BR')){
                            // If it's valid then create the address object
                            listAddress["type"] = newHeader[k][0]
                            // This for cleans the ',' beetwen tags
                            for(n=1;n<(newHeader[k].length)-1;n++) newHeader[k][n] = newHeader[k][n].slice(0,(newHeader[k][n].length-1))
                            listAddress["tags"] = _.drop(newHeader[k])
                            const number = phoneUtil.parseAndKeepRawInput(dataRows[i][k], 'BR');
                            listAddress["address"] = phoneUtil.format(number, PNF.E164)
                        }
                    } catch(err){
                        listAddress = {}
                    }

                    if(Object.keys(listAddress).length != 0)            // If it's a valid number, listAddress is not empty then insert into addresses matrix
                        addresses.push(listAddress)
                }
            }else {
                // Check if k is one of the indexes number (classes positions in newHeader), if it's not the function shall return -1
                if((_.indexOf(indexes,k)) == -1){
                    // Now I check if the eid was already inserted, if it wasn't then flag should be true
                    if(flag){
                        // Set the invisible field                        
                        if(newHeader[k] === "invisible"){
                            if(dataRows[i][k] === "1") dataRows[i][k] = "true";
                            else dataRows[i][k] = "false"
                        }    
                        // Set the see_all field
                        if(newHeader[k] === "see_all"){
                            if(dataRows[i][k] === "yes") dataRows[i][k] = "true";
                            else dataRows[i][k] = "false"
                        }  

                        // Set obj as a line in dataOutput
                        obj[newHeader[k]] = dataRows[i][k]
                    }
                    else{
                        // Update the dataOutput fields invisible and see_all
                        if(newHeader[k] === "invisible"){   
                            if((dataRows[i][k] === "1")) dataOutput[index]["invisible"] = "true";
                        }
                        if((newHeader[k] === "see_all")){   
                            if((dataRows[i][k] === "yes")) dataOutput[index]["see_all"] = "true";
                        }
                        
                    }
                }
                else{
                    // If k was in indexes, then I should concat the classes presented in the indexes fields    
                    var classesMatrix = []
                    
                    if(dataRows[i][indexes[0]] !== '')
                        classesMatrix = classesMatrix.concat(dataRows[i][indexes[0]].split(/[/,]/))
                    if(dataRows[i][indexes[1]] !== '')
                        classesMatrix = classesMatrix.concat(dataRows[i][indexes[1]].split(/[/,]/))
                }
            }
        }
        // If flag is true, then there's no record saved
        if(flag){            
            obj["classes"] = classesMatrix    // Save the classes
            obj["addresses"] = addresses      // Save the addresses
            //console.log(addresses)
            dataOutput.push(obj)              // Put obj in the dataOut
        } else{
            // Update the classes and addresses
            classesMatrix = dataOutput[index].classes.concat(classesMatrix)
            addresses = dataOutput[index].addresses.concat(addresses)
            
            dataOutput[index]["classes"] = classesMatrix
            dataOutput[index]["addresses"] = addresses

            flag = true;
        }
    }

    // With dataOutput formated, just write it on the JSON file names output
    const jsonString = JSON.stringify(dataOutput)
    fs.writeFile('./output.json',jsonString, err => {
        if(err) {
            console.log('Error writing File',err)
        } else {
            console.log('Successfully wrote file')
        }
    })    
}

/*
    This function just verify if an email is valid
*/
function verifyEmail(mail){
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
        return (true)
    else
        return (false)
}