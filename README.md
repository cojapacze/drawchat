# DrawChat API

Generate a pair of ECDSA .private.key and public.key to receive a namespace for creating your own boards. Using the private key, you can change the board settings and grant permissions to selected users.

## What do you need?

- **Base Key of the Board** - a unique string of characters that uniquely identifies the board. For example, sha256(course + date + group), or you can generate a completely random string of characters and save it in your database.
- **User** is identified by a unique alphanumeric string. For example, “Teacher1”, “Student123”, “…”
- **Permissions** define whether the user is an administrator (e.g., a teacher) or whether they have the ability to draw or participate in chat.
- **Configuration** - the board configuration is an object containing selected options: enabling/disabling extensions, the appearance of the board pages, available tools on the toolbar. The signed configuration will be applied if any user provides it to the room during their login.

Let's say you want to create a board for the course “Group403Course027” - this will be the base key of the board.

Link for moderator/teacher:

```javascript
const link = get_drawchat_link(
	$privateKey,
	$publicKey,
	“Group403Course027”, // board
	“Moderator”, // username
	"RDC___", // user permissions
	$config, // board configuration (optional)
);
```

Link for participant/student:

```javascript
const link = get_drawchat_link(
	$privateKey,
	$publicKey,
	“Group403Course027”,
	“User001”,
	"ADC___",
	$config,
);
```

You can configure the board to your needs by passing the appropriate options along with the link:

```javascript
$config = {
  pages: {
    1: {
      backgroundColor: '#F9FEE7',
      backgroundImage: 'https://imagehost.pro/templates/grid_2000.svg',
    },
    2: {
      backgroundColor: 'black',
    },
  },
};
```

Examples of generating boards using a pair of keys can be found for languages:

- PHP,
- Python,
- and NodeJS.

### Web API

You can communicate with the board using the Web API. For example, you can send a specific request to an IFRAME, and in response, you will receive a screenshot of the board, which you can save on your own server.

Draw.Chat [Draw.Chat - Virtual Paper](https://draw.chat).
