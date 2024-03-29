const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');



let tempArray = [];
const ACCESS_TOKEN = "0efd1fc0fa4b33f477c9c9118db16877401bff6595ff4d169664727905b8d062";
var username = 'abhishek1@quadrafort.com';
var password = '123456789';


var base64Credentials = btoa(username + ':' + password);

async function getData(req, res) {
    console.log('req : ',req)
    console.log("yes")
    const apiUrl = "https://api.getbase.com/v2/leads";

    axios({
        method: 'get',
        url: apiUrl,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    })
        .then(response => {
            const data = (response.data.items);
            data.map((leadData) => {
                if (leadData.data.status == "Working") {
                    if (!tempArray.includes(leadData.data.id)) {
                        tempArray.push(leadData.data.id)
                    }
                }
            })

            let finalData = checkDatePassed(tempArray, data);
            console.log('final data : ', finalData)
            // app.get('/OverDueRecords', (req, res) => {
                
                res.send(finalData);
            // });

        })
}

function calculateDaysSinceCreation(createdDate) {
    let currentDate = new Date();
    const timeDifference = currentDate - createdDate;

    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    return daysDifference;
}

function checkDatePassed(tempArray, data) {
    const dataToSend = data.filter((lead) => {
        let createdDate = new Date(lead.data.created_at);
        let daysSinceCreation = calculateDaysSinceCreation(createdDate);
        let checkInTempArray = tempArray.includes(lead.data.id);
    
        if (daysSinceCreation == 0 && !checkInTempArray) {

            axios({
                method: 'get',
                url: `https://quadrafort8574.zendesk.com/api/v2/custom_objects/apartment/records/search?query=name:"${lead.data.first_name}"`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + base64Credentials,
                },
            })
            
                .then(response => {
                
                    if (response?.data?.custom_object_records[0]?.name != lead.data.first_name || response.data.custom_object_records[0].name== undefined){
                        var data = JSON.stringify({
                            "custom_object_record": {
                                "custom_object_fields": {
                                    "leadid": lead.data.id,
                                    "status": lead.data.status
                                },
                                "name": lead.data.first_name
            
                            }
                        });
            
                        var config = {
                            method: 'POST',
                            url: 'https://quadrafort8574.zendesk.com/api/v2/custom_objects/apartment/records',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Basic ' + base64Credentials,
                            },
                            data: data,
                        };

                        axios(config)
                        .then(function (response) {
                            console.log(JSON.stringify(response.data));
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                    }
                    

                })

        }
        return daysSinceCreation === 0 && !checkInTempArray;
    });

    return dataToSend;
}



// setTimeout(getData, 0);

// const intervalInMilliseconds = 2 * 60 * 60 * 1000;
// setInterval(getData, intervalInMilliseconds);
app.get('/', getData);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});