/**
 * --------------------------------------------------------------------------
 * Resuable Messenger Component
 * --------------------------------------------------------------------------
 */



function imagePreview(input, selector) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $(selector).attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

let searchPage = 1;
let noMoreDataSearch = false;
let searchTempVal = "";
function searchUser(query) {
    if (searchTempVal != query) {
        searchPage = 1;
        noMoreDataSearch = false;
    }
    searchTempVal = query;

    if (noMoreDataSearch) {
        return;
    }
    $.ajax({
        method: 'GET',
        url: 'messenger/search',
        data: { query: query, page: searchPage },
        success: function (data) {

            if (searchPage < 2) {
                $('.user_search_list_result').html(data.records);
            } else {
                $('.user_search_list_result').append(data.records);
            }
            noMoreDataSearch = searchPage >= data?.last_page;

            searchPage++;
        },
        error: function (xhr, status, error) {

        },
    })
}

function actionOnScroll(selector, callback, topScroll = false) {
    $(selector).on('scroll', function () {
        let element = $(this).get(0);
        const condition = topScroll ? element.scrollTop === 0 :
            element.scrollTop + element.clientHeight >= element.scrollHeight;
        if (condition) {
            callback();
        }
    })
}

function debounce(callback, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            callback.apply(this, args);
        }, delay)
    }
}

/**
 * --------------------------------------------------------------------------
 * On Dom Load Event
 * --------------------------------------------------------------------------
 */

$(document).ready(function () {

    $('#select_file').change(function () {
        imagePreview(this, '.profile-img-preview');
    });

    // Search action on keyup
    const debouncedSearch = debounce(function () {
        const value = $('.user_search').val();
        searchUser(value);
    }, 500);

    $('.user_search').on('keyup', function () {
        let query = $(this).val();
        if (query.length > 0) {
            debouncedSearch();
        }
    });
    // search pagination
    actionOnScroll(".user_search_list_result", function () {
        let value = $('.user_search').val();
        searchUser(value);
    })
});




