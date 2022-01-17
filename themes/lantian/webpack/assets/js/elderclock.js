let last_date = new Date();

let tick = function () {
    var current_date = new Date();
    update_html(current_date);
    if (is_new_minute(current_date)) {
        last_date = current_date;
        minutely();
    }
    setTimeout(tick, 500);
};

let update_html = function (current_date) {
    var new_html = '';
    if (current_date.getHours() < 10) new_html += '0';
    new_html += current_date.getHours() + ':';
    if (current_date.getMinutes() < 10) new_html += '0';
    new_html += current_date.getMinutes() + ':';
    if (current_date.getSeconds() < 10) new_html += '0';
    new_html += current_date.getSeconds();
    document.getElementById('elderclock-time').innerHTML = new_html;
};

let is_new_minute = function (current_date) {
    return (
        current_date.getTime() - (current_date.getTime() % 60000) >
        last_date.getTime() - (last_date.getTime() % 60000)
    );
};

let minutely = function () {
    let plus1s_container = document.getElementById('elderclock');
    let plus1s_element = document.getElementById('elderclock-plus1s');
    if (plus1s_element != null) {
        plus1s_container.removeChild(plus1s_element);
    }
    plus1s_container.innerHTML += '<span id="elderclock-plus1s">+1s</span>';
};

export default tick;
