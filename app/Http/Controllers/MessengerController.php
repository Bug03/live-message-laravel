<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\User;
use App\Models\Message;
use App\Traits\FileUploadTrait;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessengerController extends Controller
{
    use FileUploadTrait;
    public function index(): View
    {
        $favoriteList = Favorite::with('user:id,name,avatar')->where('user_id', Auth::user()->id)->get();
        return view('messenger.index', compact('favoriteList'));
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
        $favorite = Favorite::where(['user_id' => Auth::user()->id, 'favorite_id' => $user->id])->exists();
        return response()->json([
            'user' => $user,
            'favorite' => $favorite,
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

    // fetch messages from database
    public function fetchMessages(Request $request) {
        $messages = Message::where('from_id', Auth::user()->id)->where('to_id', $request->id)
        ->orWhere("from_id",$request->id)->where('to_id', Auth::user()->id)
        ->latest()->paginate(20);

        $response = [
            'last_page' => $messages->lastPage(),
            'last_message' => $messages->last(),
            'messages' => '',
        ];

        if(count($messages) < 1) {
            $response['messages'] = "<div class='d-flex justify-content-center align-items-center h-100'><p class='text-center'>Say 'hi' and start messaging</p></div>";
            return response()->json($response);
        }
        // here we have to do little validation
        $allMesages = '';
        $messageReverse = $messages->reverse();
        foreach($messageReverse as $message) {
            $allMesages .= $this->messageCard($message, $message->attachment ? true : false);
        }

        $response['messages'] = $allMesages;

        return response()->json($response);
    }

    // fetch contacts from database
    public function fetchContacts(Request $request) {
        $users = Message::join('users', function($join) {
            $join->on('users.id', '=', 'messages.from_id')
            ->orOn('users.id', '=', 'messages.to_id');
        })
        ->where(function($q) {
            $q->where('messages.from_id', Auth::user()->id)
            ->orWhere('messages.to_id', Auth::user()->id);
        })
        ->where('users.id', '!=', Auth::user()->id)
        ->select('users.*', DB::raw('MAX(messages.created_at) as max_created_at'))
        ->orderBy('max_created_at', 'desc')
        ->groupBy('users.id')
        ->paginate(5);

        if(count($users) > 0) {
            $contacts = '';
            foreach($users as $user) {
                $contacts .= $this->getContactItem($user);
            }

        }else {
            return "<p>Your contact list is empty</p>";
        }

        return response()->json([
            'contacts' => $contacts,
            'last_page' => $users->lastPage()
        ]);
    }

    function getContactItem($user) {
        $lastMessage = Message::where('from_id', Auth::user()->id)->where('to_id', $user->id)
        ->orWhere('from_id', $user->id)->where('to_id', Auth::user()->id)
        ->latest()->first();
        $unseenCounter = Message::where('from_id', $user->id)->where('to_id', Auth::user()->id)
        ->where('seen', 0)->count();

        return view('messenger.components.contact-list-item', compact('lastMessage','unseenCounter','user'))
        ->render();
    }

    public function updateContactItem(Request $request) {
        $user = User::where('id', $request->user_id)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ],401);
        }

        $contactItem = $this->getContactItem($user);

        return response()->json([
            'contact_item' => $contactItem
        ],200);
    }

    public function makeSeen(Request $request) {
        Message::where('from_id', $request->id)
        ->where('to_id', Auth::user()->id)
        ->where('seen', 0)
        ->update(['seen' => 1]);

        return response()->json([
            'message' => 'success'
        ],200);

    }

    // add/remove to favorite
    public function favorite(Request $request) {
        $query = Favorite::where(['user_id' => Auth::user()->id ,'favorite_id' => $request->id]);
        $favoriteStatus = $query->exists();

        // if status = 0 then add to favorite
        // else remove from favorite
        if(!$favoriteStatus) {
            $star = new Favorite();
            $star->user_id = Auth::user()->id;
            $star->favorite_id = $request->id;
            $star->save();
            return response(['status' => 'added']);
        }else {
            $query->delete();
            return response(['status' => 'remove']);
        }
    }
}
