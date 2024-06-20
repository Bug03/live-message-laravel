/**
 * --------------------------------------------------------------------------
 * Resuable Messenger Component
 * --------------------------------------------------------------------------
 */



function imagePreview(input, selector) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $(selector).attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function searchUser(query) {
   $.ajax({
        method: 'GET',
        url: 'messenger/search',
        data: { query: query },
        success: function(data) {
            $('.user_search_list_result').html(data.records);
        },
        error: function(xhr, status, error) {

        },
   })
}

/**
 * --------------------------------------------------------------------------
 * On Dom Load Event
 * --------------------------------------------------------------------------
 */

$(document).ready(function() {

    $('#select_file').change(function() {
        imagePreview(this, '.profile-img-preview');
    });

    $('.user_search').on('keyup', function() {
        let query = $(this).val();
        searchUser(query);
    })
});




