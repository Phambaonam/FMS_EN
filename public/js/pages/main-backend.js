/**
 * Created by namdoremon on 8/14/17.
 */
/***
 *
 */
$('#category').click(function() {
    // $(this).addClass('active')
    $('.category').slideToggle("fast");

});
$('#product').click(function() {
    // $(this).addClass('active')
    $('.product').slideToggle("fast");

});
$('#order').click(function () {
    // $(this).addClass('active')
    $('.order').slideToggle("fast");

});
$('#user').click(function () {
    // $(this).addClass('active')
    $('.user').slideToggle("fast");
});
$('#cart').click(function () {
    // $(this).addClass('active')
    $('.cart').slideToggle("fast");
});
$('#transport').click(function () {
    // $(this).addClass('active')
    $('.transport').slideToggle("fast");
});
/***
 * Function show calendar, use datetimepicker
 */
$(function () {
    var bindDatePicker = function() {
        $(".date").datetimepicker({
            format:'YYYY-MM-DD',
            icons: {
                time: "fa fa-clock-o",
                date: "fa fa-calendar",
                up: "fa fa-arrow-up",
                down: "fa fa-arrow-down"
            }
        }).find('input:first').on("blur",function () {
            // check if the date is correct. We can accept dd-mm-yyyy and yyyy-mm-dd.
            // update the format if it's yyyy-mm-dd
            var date = parseDate($(this).val());

            if (! isValidDate(date)) {
                //create date based on momentjs (we have that)
                date = moment().format('YYYY-MM-DD');
            }

            $(this).val(date);
        });
    }

    var isValidDate = function(value, format) {
        format = format || false;
        // lets parse the date to the best of our knowledge
        if (format) {
            value = parseDate(value);
        }

        var timestamp = Date.parse(value);

        return isNaN(timestamp) == false;
    }

    var parseDate = function(value) {
        var m = value.match(/^(\d{1,2})(\/|-)?(\d{1,2})(\/|-)?(\d{4})$/);
        if (m)
            value = m[5] + '-' + ("00" + m[3]).slice(-2) + '-' + ("00" + m[1]).slice(-2);

        return value;
    }

    bindDatePicker();
});
