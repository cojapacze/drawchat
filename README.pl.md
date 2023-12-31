# DrawChat API

Wygeneruj parę kluczy ECDSA .private.key i public.key, aby otrzymać  namespace do tworzenia własnych tablic.
Za pomocą klucza prywatnego moża zmieniać ustawienia tablic oraz nadawać do nich uprawnienia wybranym użytkownikom.

## Czego potrzebujesz?

- **Klucz bazowy tablicy** - unikalny ciąg znaków, identyfikujacy jednoznacznie tablicę. Np. sha256(course + date + group), lub możesz wygenerować zupełnie losowy ciąg znaków i zapisać go w swojej bazie danych.
- **Użytkownik** identyfikowany jest za pomocą unikalnego ciągu znaków alfanumerycznych. Np. “Teacher1”, “Student123”, “…”
- **Uprawnienia** definiują czy użytkownik jest administratorem (np. nauczycielem) lub czy ma mieć możliwość rysowania lub brania udziału w czacie.
- **Konfiguracja** - konfiguracja tablicy, to obiekt zawierający wybrane opcje: włączenie/wyłączenie rozszerzeń, wygląd stron tablicy, dostępne narzędzia na pasku. Podpisana konfiguracja zostanie zastosowana, jeżeli którykolwiek użytkownik dostarczy ją do pokoju podczas swojego logowania.

Załóżmy, że chcesz stworzyć tablicę dla kursu “Group403Course027” - to będzie klucz bazowy tablicy.

Link dla moderatora/nauczyciela:

```javascript
const link = get_drawchat_link(
	$privateKey,
	$publicKey,
	“Group403Course027”, // tablica
	“Moderator”, // nazwa użytkownika
	"RDC___", // uprawnienia użytkownika
	$config, // konfiguracja tablicy (opcjonalnie)
);
```

Link dla uczestnika/ucznia:

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

Tablicę, możesz skonfigurować do swoich potrzeb przekazując odpowiednie opcje wraz z linkiem:

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

Przykłady generowania tablic przy użycia pary kluczy znajdziesz dla języków:

- PHP,
- Python,
- oraz NodeJS.

### Web API

Możesz komunikować się z tablicą za pomocą Web API. Na przykład możesz wysłać do IFRAME odpowiednie zapytanie, a w odpowiedzi otrzymasz zrzut tablicy, który będziesz mógł zachować na własnym serwerze.

Draw.Chat [Draw.Chat - wirtualny papier](https://draw.chat).
