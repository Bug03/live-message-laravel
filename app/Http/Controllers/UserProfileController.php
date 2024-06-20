<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserProfileUpdateRequest;
use App\Traits\FileUploadTrait;
use Illuminate\Support\Facades\Auth;

class UserProfileController extends Controller
{
    use FileUploadTrait;
    function update(UserProfileUpdateRequest $request) {
        $avatarPath = $this->uploadFile($request, 'avatar');

        $user = Auth::user();
        if($avatarPath) $user->avatar = $avatarPath;
        $user->name = $request->name;
        $user->user_name = $request->user_id;
        $user->email = $request->email;
        // check password
        if ($request->filled('current_password')) {
            $request->validate([
                'current_password' => ['required', 'current_password'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);
            $user->password = bcrypt($request->password);
        }

        $user->save();
        notyf()->addSuccess('Update profile successfully');
        return response()->json(['message' => 'Profile updated successfully']);

    }
}
