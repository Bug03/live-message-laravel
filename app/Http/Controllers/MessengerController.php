<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use App\Traits\FileUploadTrait;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\Auth;

class MessengerController extends Controller
{
    use FileUploadTrait;
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

    public function sendMessage(Request $request)
    {
        $request->validate([
            'id' => ['required','integer'],
            'temporaryMsgId' => ['required'],
            'attachment' => ['nullable','max:1024', 'image']
        ]);

        $attachmentPath = $this->uploadFile($request, 'attachment');

        $message = new Message();
        $message->from_id = Auth::user()->id;
        $message->to_id = $request->id;
        $message->content = $request->message;
        if($attachmentPath) $message->attachment = json_encode($attachmentPath);
        $message->save();

        return response()->json([
            'message' => $message->attachment ? $this->messageCard($message,true) : $this->messageCard($message),
            'temporaryMsgId' => $request->temporaryMsgId,
        ]);
    }

    function messageCard($message, $attachment = false) {
        return view('messenger.components.message-card', compact('message', 'attachment'))->render();
    }
}
