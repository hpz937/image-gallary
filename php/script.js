$(document).ready(function() {
    let currentPage = 1;
    let totalPages = 0;
    let currentImageIndex = -1;
    let imageUrls = [];
    let currentPath = ''; // Keep track of the current path

    function applySystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // System prefers dark theme
            $('body').addClass('dark-theme');
            $('#themeToggle').text('Light Theme');
        } else {
            // System prefers light theme or doesn't specify
            $('body').removeClass('dark-theme');
            $('#themeToggle').text('Dark Theme');
        }
    }

    applySystemTheme(); // Apply the system theme on initial load

    $('#themeToggle').click(function() {
        $('body').toggleClass('dark-theme');

        var btnText = $('body').hasClass('dark-theme') ? 'Light Theme' : 'Dark Theme';
        $(this).text(btnText);
    });

    $('#backButton').hide(); // Initially hide the button

    $('#sortButton').click(function() {
        loadImages(currentPage);
    });

    $('#sortAsc').click(function() {
        $('#sortOrder').val('asc');
        loadImages(currentPage);
        updateSortButtonHighlight(this);
    });

    $('#sortDesc').click(function() {
        $('#sortOrder').val('desc');
        loadImages(currentPage);
        updateSortButtonHighlight(this);
    });

    function loadImages(page, callback) {
        let sortField = $('#sortField').val();
        let sortOrder = $('#sortOrder').val();

        $('#loadingOverlay').show();

        $.getJSON(`imageLoader.php?page=${page}&subdir=${currentPath}&sort=${sortField}&order=${sortOrder}`, function(response) {
            imageUrls = [];
            // Clear previous content
            $('#imageGallery').empty();
            $('#imageGallery').append('<div id="subdirList" class="mb-4"></div>'); // Sub-directory section
            $('#imageGallery').append('<div id="imageList" class="row"></div>'); // Image thumbnails section
            $('#modalImage').attr('src', '#');

            // Display sub-directories
            if (response.subdirectories && response.subdirectories.length > 0) {
                response.subdirectories.forEach(function(dir) {
                    let subdirLink = $('<a>').attr('href', '#').text(dir).addClass('subdir-link btn btn-outline-primary btn-sm m-1').attr('data-subdir', dir);
                    $('#subdirList').append(subdirLink);
                });
            }

            // Hide or Show Sorting Controls based on the number of images
            if (response.images && response.images.length > 0) {
                $('#sortingControlsContainer').show();
                $('.pagination').show();
            } else {
                $('#sortingControlsContainer').hide();
                $('.pagination').hide();
            }

            response.images.forEach(function(imageUrl) {
                imageUrls.push(imageUrl);
                let col = $('<div class="col-lg-2 col-md-4 col-sm-6 mb-4">');
                let img = $('<img>').attr('src', imageUrl.thumbnail).addClass('img-thumbnail');
                img.attr('fullsrc', imageUrl.fullsize);
                col.append(img);
                // $('#imageGallery').append(col);
                $('#imageList').append(col);
            });

            totalPages = response.totalPages;
            updatePagination(page);
            saveCurrentPath();
            if(currentPath !== '') {
                $('#currentDirectory').text('Current Directory: ' + currentPath);
            } else {
                $('#currentDirectory').text('');
            }
            $('#loadingOverlay').hide(); // Hide the loading icon after images are loaded
            if (callback) {
                callback(); // Call the callback function after images are loaded
            }
        });
    }

    function updatePagination(page) {
        currentPage = page;
        let pagination = $('.pagination');
        pagination.find('.page-item').not('#firstPage, #previousPage, #nextPage, #lastPage').remove();

        let startPage = Math.max(1, page - 3);
        let endPage = Math.min(page + 3, totalPages);

        for (let i = startPage; i <= endPage; i++) {
            let pageItem = $('<li class="page-item">').append($('<a class="page-link">').text(i).attr('href', '#'));
            if (i === page) pageItem.addClass('active');
            $('#nextPage').before(pageItem);
        }

        $('#firstPage, #previousPage').toggleClass('disabled', page === 1);
        $('#nextPage, #lastPage').toggleClass('disabled', page === totalPages);
    }

    function updateModalImage(index) {
        if (index >= 0 && index < imageUrls.length) {
            currentImageIndex = index;
            let thumbnailUrl = imageUrls[index].thumbnail;
            let fullImageUrl = imageUrls[index].fullsize;

            $('#modalImage').attr('src', fullImageUrl);
            $('#fullSizeLink').attr('href', fullImageUrl);
            // $('#prevImage').prop('disabled', index === 0);
            // $('#nextImage').prop('disabled', index === imageUrls.length - 1);
        } else {
            // Check if we need to load a new page
            if (index < 0 && currentPage > 1) {
                // Load the previous page and set index to last image of that page
                loadImages(currentPage - 1, function() {
                    updateModalImage(imageUrls.length - 1);
                });
            } else if (index >= imageUrls.length && currentPage < totalPages) {
                // Load the next page and set index to first image of that page
                loadImages(currentPage + 1, function() {
                    updateModalImage(0);
                });
            }
        }
    }

    // Image thumbnail click event
    $('#imageGallery').on('click', '.img-thumbnail', function() {
        let index = $('.img-thumbnail').index(this);
        updateModalImage(index);
        $('#imageModal').modal('show');
    });

    // When a subdirectory link is clicked
    $('#imageGallery').on('click', '.subdir-link', function(e) {
        e.preventDefault();
        let subdir = $(this).attr('data-subdir');
        currentPath = currentPath + '/' + subdir
        loadImages(1);
        if(subdir != '') {
            $('#backButton').show(); // Show the back button
        }
    });

    // Event when the modal is closed
    $('#imageModal').on('hidden.bs.modal', function () {
        // Clear the src attribute of the modal image
        $('#modalImage').attr('src', '');
    });

    // Next and Previous button events
    $('#nextImage').click(function() {
        updateModalImage(currentImageIndex + 1);
    });

    $('#prevImage').click(function() {
        updateModalImage(currentImageIndex - 1);
    });

    // Pagination control clicks
    $('.pagination').on('click', '.page-link', function(e) {
        e.preventDefault();
        let newPage = this.parentElement.getAttribute('id');

        switch (newPage) {
            case 'firstPage': newPage = 1; break;
            case 'previousPage': newPage = Math.max(1, currentPage - 1); break;
            case 'nextPage': newPage = Math.min(totalPages, currentPage + 1); break;
            case 'lastPage': newPage = totalPages; break;
            default: newPage = parseInt($(this).text());
        }

        if (newPage !== currentPage) {
            loadImages(newPage);
        }
    });

    // Function to save the current path in localStorage
    function saveCurrentPath() {
        if (typeof(Storage) !== 'undefined') {
            localStorage.setItem('currentPath', currentPath);
            localStorage.setItem('currentPage', currentPage);
        }
    }

    // Function to load the current path from localStorage
    function loadCurrentPath() {
        if (typeof(Storage) !== 'undefined') {
            currentPath = localStorage.getItem('currentPath') || '';
            currentPage =  parseInt(localStorage.getItem('currentPage')) || 1;
            // totalPages = 999;
            if (currentPath !== '') {
                $('#backButton').show();
            }
        }
        return '';
    }

    function updateSortButtonHighlight(activeButton) {
        // Remove active-sort class from both buttons
        $('#sortAsc, #sortDesc').removeClass('active-sort');

        // Add active-sort class to the clicked button
        $(activeButton).addClass('active-sort');
    }

    // Initial load
    $('#backButton').hide().click(function() {
        let pathArray = currentPath.split('/');
        pathArray.pop(); // Remove the last part of the path
        currentPath = pathArray.join('/');
        currentPage = 1;
        loadImages(1);
        if (currentPath === '') {
            $(this).hide(); // Hide the button if in the base directory
        }
    });

    let initialSortOrder = $('#sortOrder').val();
    if (initialSortOrder === 'asc') {
        updateSortButtonHighlight('#sortAsc');
    } else {
        updateSortButtonHighlight('#sortDesc');
    }

    loadCurrentPath();

    loadImages(currentPage);
});

