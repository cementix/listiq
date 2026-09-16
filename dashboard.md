# Dashboard idea

## Цель

Сделать главную страницу dashboard не как заглушку со статами, а как живую стартовую страницу Listiq: зашел, сразу видишь цепляющий тайтл, рядом рандомные рекомендации, ниже Netflix-style карусели с тайтлами, списками и активностью.

Это не учебная страница и не лендинг. Это продуктовый экран, который должен двигать пользователя к действиям: открыть тайтл, добавить в библиотеку, поставить оценку, написать отзыв, посмотреть список.

## Основная композиция

### 1. Hero: тайтл дня / тайтл недели

Большой блок слева, примерно 60-70% ширины.

Что внутри:

- большой backdrop или широкий постер;
- название;
- тип: game / movie / series / anime / manga / book;
- год или точная дата релиза, если есть;
- жанры;
- короткое описание;
- причина показа: "популярно на этой неделе", "вышло сегодня", "обсуждают сейчас";
- действия: открыть, добавить в библиотеку, написать отзыв.

Идея: сначала можно назвать это "Тайтл недели", потому что его проще сделать стабильным. Потом превратить в "Тайтл дня", когда будет нормальная синхронизация внешних баз.

### 2. Правая колонка

Маленькая колонка справа от hero.

Идея: 4 полностью рандомных тайла, без жесткого деления по типам. Там может выпасть игра, сериал, фильм, аниме, манга, книга.

Что важно:

- это не должны быть огромные карточки;
- каждый тайл кликабельный;
- можно показывать мини-постер, название, тип и год;
- обновляется при каждом заходе или раз в день.

### 3. Карусели ниже

Netflix-style горизонтальные ряды:

- Ваши последние отзывы
- Популярные списки
- Вам может понравиться
- Сейчас обсуждают
- Драма
- Игры 2026
- Инди игры
- Комедии
- Высоко оценили пользователи
- Новые релизы
- Аниме сезона
- Манга, которую часто добавляют

Первые 2-3 секции должны быть стабильными и полезными. Остальные можно выбирать рандомно из пула, чтобы dashboard не выглядел одинаково каждый раз.

## Что мешает сделать это нормально прямо сейчас

Текущая модель `Title` уже умеет хранить разные типы:

- `MOVIE`
- `SERIES`
- `ANIME`
- `MANGA`
- `MANHWA`
- `BOOK`
- `GAME`
- `NOVEL`
- `COMIC`
- `OTHER`

Но для нормального dashboard и автосидинга данных пока не хватает:

- внешнего provider id;
- источника данных;
- точной даты релиза, а не только `year`;
- backdrop image отдельно от cover image;
- внешнего рейтинга / popularity / vote count;
- поля `isAdult` или похожего фильтра;
- `lastSyncedAt`;
- сырого payload или хотя бы provider metadata;
- нормального способа не создавать дубликаты между источниками.

Минимально нормальная будущая структура:

- `Title` - канонический тайтл внутри Listiq;
- `ExternalTitle` - связь с внешними базами: provider, externalId, url, rawData, lastSyncedAt;
- `TitleMetricSnapshot` - популярность/рейтинг на конкретную дату;
- `DashboardFeature` или `TitleOfDay` - какой тайтл выбран для hero и почему.

## Источники данных

### Games

#### RAWG

Документация: https://rawg.io/apidocs

Плюсы:

- простой REST API;
- есть игры, жанры, даты релиза, Metacritic, рейтинги, скриншоты;
- можно фильтровать по `dates`;
- можно сортировать по `added`, `rating`, `metacritic`, `released`;
- бесплатный план до 20k requests/month, но только для non-commercial и с backlink requirement.

Хорошо подходит для MVP-сидинга игр.

Примеры идей запросов:

- игры, вышедшие сегодня: `/games?dates=YYYY-MM-DD,YYYY-MM-DD&ordering=-added`
- популярные игры года: `/games?dates=2026-01-01,2026-12-31&ordering=-added`
- высоко оцененные игры: `/games?ordering=-rating`
- игры с Metacritic: `/games?metacritic=80,100&ordering=-metacritic`

#### IGDB

Документация: https://api-docs.igdb.com/

Плюсы:

- сильная игровая база;
- есть release dates, popularity, screenshots, videos, franchises;
- можно точнее строить "игра дня".

Минусы:

- нужна Twitch auth;
- API чуть тяжелее по интеграции;
- лучше брать после RAWG, когда MVP уже живой.

Вывод: для первой версии брать RAWG, IGDB оставить как второй этап.

### Movies / Series

#### TMDB

Документация:

- Trending: https://developer.themoviedb.org/reference/trending-all
- Discover movie: https://developer.themoviedb.org/reference/discover-movie
- Popularity / Trending explanation: https://developer.themoviedb.org/docs/popularity-and-trending

Плюсы:

- лучший старт для фильмов и сериалов;
- есть trending day/week;
- есть discover с фильтрами по датам, жанрам, popularity;
- есть poster/backdrop images;
- можно строить "популярный фильм/сериал недели".

Хорошие запросы:

- trending за день: `/trending/all/day`
- trending за неделю: `/trending/all/week`
- фильмы по дате релиза: `/discover/movie?primary_release_date.gte=...&primary_release_date.lte=...&sort_by=popularity.desc`
- сериалы можно тянуть через TV discover/trending.

Вывод: TMDB нужен почти точно, если dashboard должен выглядеть как Netflix.

### Anime / Manga

#### AniList

Документация:

- Getting started: https://docs.anilist.co/guide/graphql/
- Media query: https://docs.anilist.co/guide/graphql/queries/media
- Query reference: https://docs.anilist.co/reference/query

Плюсы:

- GraphQL;
- read-запросы можно делать без auth;
- есть anime и manga;
- есть sort по trending/popularity/score;
- есть season/seasonYear;
- можно сделать секции "Аниме сезона", "Популярная манга", "Сейчас в тренде".

Хорошие запросы:

- anime trending: `media(type: ANIME, sort: TRENDING_DESC, isAdult: false)`
- manga popular: `media(type: MANGA, sort: POPULARITY_DESC, isAdult: false)`
- сезонное anime: `media(type: ANIME, seasonYear: 2026, sort: TRENDING_DESC)`

Вывод: AniList отлично подходит для anime/manga MVP.

### Books

#### Open Library

Документация:

- APIs: https://openlibrary.org/developers/api
- Search API: https://openlibrary.org/dev/docs/api/search

Плюсы:

- бесплатная открытая база;
- есть поиск, author, first publish year, covers;
- можно использовать для книг.

Минусы:

- в документации прямо сказано, что API не предназначен быть bulk backend для сторонних сервисов;
- для массового импорта лучше смотреть bulk downloads, а не долбить API.

Вывод: книги лучше добавить позже. Для MVP dashboard можно оставить книги из ручного seed или маленького аккуратного импорта.

#### Google Books

Документация: https://developers.google.com/books/docs/v1/reference/volumes/list

Плюсы:

- простой поиск книг;
- есть `orderBy=newest`;
- максимум 40 results за запрос.

Минусы:

- качество данных и covers может быть неровным;
- не идеален для красивого media-dashboard.

Вывод: можно рассмотреть как запасной вариант для книг, но не начинать с него.

## Реалистичная стратегия сидинга

### Этап 1: ручной + API seed для MVP

Цель: быстро получить 300-1000 нормальных тайтлов, чтобы dashboard выглядел живым.

Источники:

- RAWG: 150-300 games;
- TMDB: 200-400 movies/series;
- AniList: 150-300 anime/manga;
- книги пока оставить 30-50 вручную или аккуратно из Open Library.

Что сидим:

- name;
- slug;
- type;
- year;
- releaseDate;
- description;
- imageUrl;
- backdropUrl;
- genres;
- external provider ids;
- popularity/rating/vote count, если есть.

### Этап 2: daily sync

Нужен скрипт или cron job:

- раз в день тянет новые/популярные тайтлы;
- upsert по `provider + externalId`;
- обновляет метрики;
- не ломает пользовательские данные;
- не удаляет локальные тайтлы, если источник пропал.

Для локальной разработки это может быть npm script:

- `npm run seed:titles`
- `npm run sync:titles`
- `npm run pick:title-of-day`

Для продакшена позже:

- Vercel Cron;
- GitHub Actions по расписанию;
- отдельный worker;
- ручная кнопка админа "Sync titles".

### Этап 3: title of day

Механика:

1. Собрать кандидатов за последние 7-14 дней и ближайшие 7 дней.
2. Добавить trending/popular candidates из TMDB, RAWG, AniList.
3. Посчитать score.
4. Выбрать победителя.
5. Записать выбор в БД на дату.

Пример scoring:

- `releaseRecencyScore` - вышло сегодня или недавно;
- `providerPopularityScore` - популярность во внешней базе;
- `ratingScore` - внешний рейтинг, если хватает голосов;
- `localActivityScore` - сколько пользователей Listiq добавили/оценили/обсудили;
- `freshnessPenalty` - не показывать одно и то же слишком часто;
- `adultPenalty` - не показывать adult-контент в hero.

Пример идеи:

```txt
finalScore =
  releaseRecencyScore * 0.35 +
  providerPopularityScore * 0.30 +
  ratingScore * 0.15 +
  localActivityScore * 0.15 -
  freshnessPenalty * 0.05
```

Смысл: если сегодня вышла громкая игра, она реально может победить и стать title of day.

## Механика списков

Списки нужны отдельно, потому что dashboard без них будет только каталогом.

Будущие модели:

- `TitleList`
- `TitleListItem`

Поля для `TitleList`:

- ownerId;
- title;
- slug;
- description;
- coverUrl;
- visibility: public/private/friends;
- createdAt;
- updatedAt;

Поля для `TitleListItem`:

- listId;
- titleId;
- position;
- note;
- createdAt.

Dashboard-секции для списков:

- популярные публичные списки;
- последние списки друзей;
- ваши списки;
- списки по жанру;
- подборки редакции, если когда-нибудь появится admin curation.

## MVP dashboard без переусложнения

Первая нормальная версия:

1. Слегка расширить БД тайтлов под внешние источники.
2. Сделать seed/sync для RAWG + TMDB + AniList.
3. Сделать hero "Тайтл недели" или "Тайтл дня".
4. Сделать правую колонку из 4 random titles.
5. Сделать 5-7 каруселей:
   - ваши последние отзывы;
   - популярные тайтлы;
   - новые релизы;
   - игры 2026;
   - anime trending;
   - drama;
   - random genre row.

Списки лучше делать следующим отдельным куском, потому что это уже своя фича с CRUD, privacy и sorting.

## Важный продуктовый вывод

Не надо сейчас пытаться сделать идеальную рекомендательную систему. Сначала нужна богатая БД тайтлов и красивый dashboard с правдоподобными секциями.

Правильный порядок:

1. Нормальная модель внешних источников.
2. Импорт/сидинг тайтлов.
3. Dashboard rails.
4. Title of day/week.
5. Lists.
6. Более умные рекомендации.

Так проект будет расти как продукт, а не как куча красивых карточек без данных.
