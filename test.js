const kickbox = require('kickbox').client('live_50beebe8bcc59af340a905ae67c120dcb4f7e8847c2d60bd5196380255eeaa78').kickbox()

kickbox.verify('Phambaonam1312@gmail.com', function (err, response) {
    // Let's see some results
    console.log(response.body)
})