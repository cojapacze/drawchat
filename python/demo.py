from drawchat.keys import load_private_key_from_pem_file, load_public_key_from_pem_file
from drawchat.open import get_drawchat_link

private_key = load_private_key_from_pem_file('../keys/.private.key')
public_key = load_public_key_from_pem_file('../keys/public.key')

BOARD_UNIQUE_KEY = "MyBoardUniqueKey"

USERNAME = "User123"

PERMISSIONS = "RDC___"
# "RDC___" - is an administrator (teacher), can draw and chat
# "ADC___" - is a user (student), can access board, can draw and chat
# "AD____" - is a user (student), can access board, can draw, but can't chat
# "A_C___" - is a user (student), can access board, can chat, but can't draw
# "A_____" - is a user (student), can access board, but can't draw and chat

OPTIONS = {
    # "timestamp": datetime.now(),  # Uncomment to use the current timestamp
    "features": {
        "displayChat": False,
        "displayChatWebrtc": False,
        "displayCrosshair": False,
        "displayPages": True,
        "displayToolbar": True,
        "displayViewports": False,
    },
    "toolbar": [
        # "sketchbook",
        # "share",
        "download",
        # "upload",
        # "reset",
        "pen",
        # "autopen",
        # "crayon",
        # "smoothpen",
        "highlighter",
        # "feather",
        # "nib",
        # "rainbow",
        # "mandala",
        # "line",
        # "rectangle",
        # "ellipse",
        # "type",
        # "image",
        "colorpicker",
        "undo-redo",
        # "cutout",
        "eraser",
        "move-viewport",
        "rotate-viewport",
        "zoom",
        "center",
        # "layers-switcher",
        # "viewport-position",
        "connection-status",
        # "fullscreen",
    ],
    "defaultTool": "pen",
    # "title": "Example title",
    # "description": "Example description",
    "pages": {
        1: {
            "backgroundColor": "#F9FEE7",
            "backgroundImage": "https://imagehost.pro/templates/grid_2000.svg",
            "foregroundImage": "https://imagehost.pro/templates/colouring_cat.svg",
        },
        2: {
            "backgroundColor": "#FEF9E7",
            "backgroundImage": "https://upload.wikimedia.org/wikipedia/commons/1/17/A-DNA_orbit_animated_small.gif",
        },
        3: {
            "backgroundColor": "LightSeaGreen",
        },
    },
}


URL = get_drawchat_link(
    private_key, public_key, BOARD_UNIQUE_KEY, USERNAME, PERMISSIONS, OPTIONS)

print(URL)
