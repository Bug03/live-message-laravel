<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\Auth;

class MessengerController extends Controller
{
    public function index(): View
    {
        return view('messenger.index');
    }

    public function search(Request $request)
    {
        $getRecords = null;
        $input = $request['query'];
        $records = User::where('id', '!=', Auth::user()->id)
            ->where(function ($query) use ($input) {
                $query->where('name', 'like', "%{$input}%")
                    ->orWhere('user_name', 'like', "%{$input}%");
                })
            ->paginate(10);

        if($records->total() < 1) {
            $getRecords .="<p class='text-center'>Nothing to show</p>";
        }
        foreach($records as $record) {
            $getRecords .= view('messenger.components.search-item', compact('record'))->render();
        }
        return response()->json([
            'records' => $getRecords,
            'last_page' => $records->lastPage(),
        ]);
    }

    public function fetchIdInfo(Request $request)
    {
        $user = User::where('id', $request->id)->first();
        
        return response()->json([
            'user' => $user,
        ]);
    }
}
