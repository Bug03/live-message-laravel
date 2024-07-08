@php
    $image = json_decode($photo->attachment);
@endphp
<li>
    <a class="venobox" data-gall="gallery01" href="{{ asset($image)}}">
        <img src="{{ asset($image)}}" alt="gallery1" class="img-fluid w-100" loading="lazy">
    </a>
</li>
