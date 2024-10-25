    //------------------------------------------------ Variables ------------------------------------------------ //


    let allAnimes = []; 
    let userName = "";
    const userInnerId = "32fe46ee";
    const searchInput = document.querySelector('.search-anime');
    const inputField = document.querySelector('.anime-input');


    //------------------------------------------------ Initial Methods ------------------------------------------------ //


    // Call injection HTML on page initiliazing
    document.addEventListener('DOMContentLoaded', (event) => {
        fetchUserAnimes(userInnerId);
        fetchSuggestedAnimes(userInnerId);
        alert("Estamos iniciando o servidor... Por ser uma hospedagem gratuita, o primeiro acesso pode demorar um pouquinho (até 1 minutinho). Obrigado pela paciência! 😄");
    });
    

    //------------------------------------------------ Fetch Functions ------------------------------------------------ //
    

    // Call AnimeTracker API to get User Data
    async function fetchUserAnimes(userId) {
        const url = `https://animes-tracker.onrender.com/users/${userId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            userName = data.username;
            allAnimes = data.watchedAnimes; 

            countAnimesStatus(allAnimes);

            renderAnimes(allAnimes); 

            loadUserDataToInnerHTML();

            const toggleIcon = document.querySelector('.filter-menu-toggler');
            toggleIcon.classList.remove('hidden');
            const searchAnime = document.querySelector('.search-anime');
            searchAnime.classList.remove('hidden');

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Call AnimeTracker API to get User Recommendations
    async function fetchSuggestedAnimes(userId) {
        const url = `https://animes-tracker.onrender.com/users/recommendaion/${userId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            renderSuggestedAnimes(data); 

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Call AnimeTracker to update the User WatchedAnime list
    const updateUserAnimeList = async () => {
        const url = 'https://animes-tracker.onrender.com/users';

        const bodyData = {
            id: userInnerId,
            username: "Fernando",
            password: "",
            email: "",
            watchedAnimes: allAnimes
        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`);
            }

            const data = await response.json();
            fetchSuggestedAnimes(userInnerId); 
            console.log("Usuário atualizado com sucesso:", data);
        } catch (error) {
            console.error("Erro ao atualizar o usuário:", error);
        }
    };


    async function fetchSearchedAnimes(searchQuery, amount) {
        const url = `https://graphql.anilist.co/`;
        try {
            const response = await fetch(url, {
            method: 'POST',
        
            headers: {
                "Content-Type": "application/json"
            },
        
            body: JSON.stringify({
                query: `query {
                            Page(page: 1, perPage: ${amount}) {
                                media(type: ANIME, sort: POPULARITY_DESC, search: "${searchQuery}") {
                                    id
                                    title {
                                        romaji
                                        english
                                        native
                                    }
                                    description
                                    coverImage {
                                        large
                                    }
                                    genres
                                    tags {
                                        name
                                    }
                                    staff {
                                        edges {
                                            role
                                            node {
                                                name {
                                                    full
                                                }
                                            }
                                        }
                                    }
                                    studios {
                                        edges {
                                            isMain
                                            node {
                                                name
                                            }
                                        }
                                    }
                                    source
                                    averageScore
                                    seasonYear
                                    episodes
                                    studios {
                                        edges {
                                            isMain
                                            node {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }`
            })
            })

            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`);
            }

            const animeData = await response.json();
            return animeData.data.Page.media;
        }catch (error) {
            return error;
        }
    }


    //------------------------------------------------ Util Functions ------------------------------------------------ //

    
    // Call Search when enter press at input
    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            inputField.blur(); 
            renderSearchAnimes(); 
        }
    });

    // Convert Anilist API responde to AnimeTrakcer Anime Object
    function anilistResposeToAnimeTrackerObject(responses){
        let AnimeTrackerObjectList = [];
        responses.forEach( (response) => {
            const tags = [];
            response.tags.forEach((tag) => tags.push(tag.name));

            var author = "N/A";
            var director = "N/A";
            response.staff.edges.forEach((edge) => {
            if (edge.role == 'Original Creator'){
                author = edge.node.name.full;
            }if (edge.role == 'Director'){
                director = edge.node.name.full;
            }
            });

            const AnimeTrackerObject = {
                id: response.id,
                titleEnglish: response.title.english ?? response.title.romaji,
                titleRomaji: response.title.romaji,
                descriptionEnglish: response.description,
                coverImage: response.coverImage.large,
                genres: response.genres,
                tags: tags,
                studios: response.studios.edges[0]?.node?.name || 'N/A',
                source: response.source,
                year: response.seasonYear,
                averageScore: response.averageScore,
                author: author,
                mainDirector: director,
                numberOfEpisodes: response.episodes,
                episodeCount: 0,
                status: "PLAN_TO_WATCH"
            };
            AnimeTrackerObjectList.push(AnimeTrackerObject);
        });
        return AnimeTrackerObjectList;
    }

    // Add Anime to List and Update UserData
    async function addAnimeToUserList(button){
        const container = button.closest('.flex-col');
        const animeTitle = container.querySelector('h3.font-bold').textContent; 
        console.log(animeTitle);

        fetchSearchedAnimes(animeTitle, 1)
            .then(response => {
                const animeTrackerObject = anilistResposeToAnimeTrackerObject(response)[0];
                allAnimes.push(animeTrackerObject);
                updateUserAnimeList();
                countAnimesStatus(allAnimes);
                if (button.classList.contains('suggested-button')){
                    renderAnimes(allAnimes);
                }
        })  
        .catch(error => {
        console.error('Erro ao buscar animes:', error);
        });
    }

    // Remove Anime from List and Update UserData
    function removeAnimeToUserList(button){
        const container = button.closest('.flex-col');
        const animeTitle = container.querySelector('h3.font-bold').textContent; 

        fetchSearchedAnimes(animeTitle, 1)
            .then(response => {
                const animeTrackerObject = anilistResposeToAnimeTrackerObject(response)[0];
                allAnimes.push(animeTrackerObject);
                const filteredAnimes = allAnimes.filter(anime => anime.titleEnglish !== animeTitle);
                allAnimes = filteredAnimes;
                updateUserAnimeList();
        })  
        .catch(error => {
        console.error('Erro ao buscar animes:', error);
        });
    }

    // Change the Anime Status and ProgressBar on +/- buttons OnClick Event
    function changeProgressBarAndStatus(button, amount) {
        const container = button.closest('.relative');
        const progressBar = container.querySelector('.progress-bar');
        let progress = parseInt(progressBar.textContent.replace('%', ''), 10); 
        progress = Math.max(0, Math.min(100, progress + amount)); 

        const animeTitle = container.querySelector('h3.font-bold').textContent; 
        const anime = allAnimes.find(a => a.titleEnglish === animeTitle); 

        if (amount > 0) {
            anime.episodeCount += 1; 
        } else if (amount < 0 && anime.episodeCount > 0) {
            anime.episodeCount -= 1; 
        }

        const statusButton = container.querySelector('.status-button');

        if (progress === 0) {
            var toRemove = ['bg-blue-800', 'bg-rose-700', 'bg-emerald-400', 'hover:bg-blue-700', 'hover:rose-600', 'hover:bg-emerald-300'];
            var toAdd = ['bg-amber-400', 'hover:bg-amber-300'];
            updateClasses(statusButton, toRemove, toAdd);
            updateClasses(progressBar, toRemove, toAdd);
            anime.status = "PLAN_TO_WATCH";
        } else if (progress > 0 && progress < 100) {
            var toRemove = ['bg-amber-400', 'bg-rose-700', 'bg-emerald-400', 'hover:bg-amber-300', 'hover:rose-600', 'hover:bg-emerald-300'];
            var toAdd = ['bg-blue-800', 'hover:bg-blue-700'];
            updateClasses(statusButton, toRemove, toAdd);
            updateClasses(progressBar, toRemove, toAdd);
            anime.status = "WATCHING";
        } else if (progress === 100) {
            var toRemove = ['bg-blue-800', 'bg-amber-400', 'hover:bg-blue-700', 'hover:bg-amber-300'];
            var toAdd = ['bg-emerald-400', 'hover:bg-emerald-300'];
            updateClasses(statusButton, toRemove, toAdd);
            updateClasses(progressBar, toRemove, toAdd);
            anime.status = "COMPLETED";
        }
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress + '%';
            countAnimesStatus(allAnimes);
            updateUserAnimeList();
            console.log(`Updated ${anime.titleEnglish} status: ${anime.status}, episodeCount: ${anime.episodeCount}`);
        }
    
    // Add and Remove an List of Classes for a Component
    function updateClasses(element, removeClasses, addClasses) {
        removeClasses.forEach(cls => element.classList.remove(cls));
        addClasses.forEach(cls => element.classList.add(cls));
    }

    // Toggle the Visibility of AnimeStatusMenu
    function toggleInfoBox(component) {
        const container = component.closest('.relative');
        const infoOverlay = container.querySelector('.info-box')
        
        if (infoOverlay.classList.contains("hidden")) {
            infoOverlay.classList.remove("hidden");
            infoOverlay.classList.add("z-40");
        } else {
            infoOverlay.classList.remove("z-40");
            infoOverlay.classList.add("hidden");
        }
    }

    // Toggle the Visibility of AnimeStatusMenu
    function toggleAnimeStatusMenu(button) {
        const menu = button.nextElementSibling;
        menu.classList.toggle('hidden');
    }

    // Toggle the Visibility of BookMark Buttons
    function toggleBookMarkButton(visibleButton) {
        if (visibleButton.classList.contains('bookmark-button')){
            fetchSuggestedAnimes(userInnerId);
            const button = visibleButton.nextElementSibling;
            button.classList.toggle('hidden');
            visibleButton.classList.toggle('hidden');
            addAnimeToUserList(visibleButton);
        } else {
            const button = visibleButton.previousElementSibling;
            button.classList.toggle('hidden');
            visibleButton.classList.toggle('hidden');
            removeAnimeToUserList(visibleButton);
        }
        
    }

    // Add Suggest AnimeToList
    function addSuggestAnimeToList(button) {
            const container = button.closest('.flex-col');
            container.classList.add('hidden');
            addAnimeToUserList(button).then(()=>{
                 
            });
    }

    // Select the AnimeStatusMenu and Toggle the Visibility
    function selectOptionFromAnimeStatusMenu(option) {
        const container = option.closest('.flex-col');
        const progressBar = container.querySelector('.progress-bar');
        const statusButton = container.querySelector('.status-button');
        const animeTitle = container.querySelector('h3.font-bold').textContent; 
        const anime = allAnimes.find(a => a.titleEnglish === animeTitle); 

        switch (option.textContent) {
            case "Plan to Watch":
                var toRemove = ['bg-blue-800', 'bg-rose-700', 'bg-emerald-400','bg-rose-700', 'hover:rose-600', 'hover:bg-blue-700', 'hover:rose-600', 'hover:bg-emerald-300'];
                var toAdd = ['bg-amber-400', 'hover:bg-amber-300'];
                updateClasses(statusButton, toRemove, toAdd);
                updateClasses(progressBar, toRemove, toAdd);
                progressBar.textContent = '0%';
                progressBar.style.width = '0%';

                anime.episodeCount = 0;
                anime.status = "PLAN_TO_WATCH"
                break;
            case "Watching":
                var toRemove = ['bg-amber-400', 'bg-rose-700', 'bg-emerald-400','bg-rose-700', 'hover:rose-600', 'hover:bg-amber-300', 'hover:rose-600', 'hover:bg-emerald-300'];
                var toAdd = ['bg-blue-800', 'hover:bg-blue-700'];
                
                updateClasses(statusButton, toRemove, toAdd);
                updateClasses(progressBar, toRemove, toAdd);

                anime.episodeCount = 1;
                var progress = (anime.episodeCount * 100/ anime.numberOfEpisodes).toFixed(2);
                var roundedProgress = parseFloat(progress);

                progressBar.textContent = roundedProgress + '%';
                progressBar.style.width = roundedProgress +'%';

                anime.status = "WATCHING";
                break;
            case "Complete":
                var toRemove = ['bg-blue-800', 'bg-amber-400', 'hover:bg-blue-700','bg-rose-700', 'hover:rose-600', 'hover:bg-amber-300'];
                var toAdd = ['bg-emerald-400', 'hover:bg-emerald-300'];
                updateClasses(statusButton, toRemove, toAdd);
                updateClasses(progressBar, toRemove, toAdd);
                progressBar.textContent = '100%';
                progressBar.style.width = '100%';

                anime.episodeCount = anime.numberOfEpisodes;
                anime.status = "COMPLETED"
                break;
            case "Drop":
                if(anime.status != 'COMPLETED'){
                    var toRemove = ['bg-blue-800','bg-amber-400', 'bg-emerald-400', 'hover:bg-blue-700', 'hover:bg-amber-300', 'hover:bg-emerald-300'];
                    var toAdd = ['bg-rose-700', 'hover:rose-600'];
                    updateClasses(statusButton, toRemove, toAdd);
                    updateClasses(progressBar, toRemove, toAdd);
                    anime.status = "DROPPED"
                }
                break;
            case "Remove":
                const filteredAnimes = allAnimes.filter(anime => anime.titleEnglish !== animeTitle);
                allAnimes = filteredAnimes;
                renderAnimes(allAnimes);
                break;
            }
        countAnimesStatus(allAnimes);
        updateUserAnimeList();
        const menu = option.parentElement;
        menu.classList.add('hidden');
    }

    // Inject the User Data to the HTML components
    function loadUserDataToInnerHTML(){
        const titleUser = document.querySelector('.title-user');
        const descriptionUser = document.querySelector('.description-user');
        descriptionUser.innerHTML = userName;
        titleUser.innerHTML = `Welcome ${userName}!`;
    }

    // Count the quantity of COMPLETED, WATCHING, PLANTOWATCH and DROPPED Animes and injects into HTML components
    function countAnimesStatus(animes){
        var countCompleted = 0;
        var countWatching = 0;
        var countPlanToWatch = 0;
        var countDropped = 0;

        animes.forEach(anime=>{
            switch (anime.status) {
                case "PLAN_TO_WATCH":
                    countPlanToWatch++;
                    break;
                case "WATCHING":
                    countWatching++;
                    break;
                case "COMPLETED":
                    countCompleted++;
                    break;
                case "DROPPED":
                    countDropped++;
                    break;        }

            const h2Completed = document.querySelector('.count-completed');
            const h2Watching = document.querySelector('.count-watching');
            const h2PlanToWatch = document.querySelector('.count-plantowatch');
            const h2Dropped = document.querySelector('.count-dropped');
            
            h2Completed.innerHTML = `Completed: ${countCompleted}`;
            h2Watching.innerHTML = `Watching: ${countWatching}`;
            h2PlanToWatch.innerHTML = `Plan to Watch: ${countPlanToWatch}`; 
            h2Dropped.innerHTML = `Dropped: ${countDropped}`;
        });
    }

    // Toggle the Visibility of AnimeFiltersMenu
    function toggleFiltersMenu() {
        const filterPanel = document.getElementById('filterPanel');
        filterPanel.classList.toggle('hidden');
    }


    //------------------------------------------------ Filter Functions ------------------------------------------------ //


    // Filter Animes by Status on AnimeFiltersMenu
    function filterAnimesByStatus(status) {
        let filteredAnimes;
        toggleFiltersMenu();
        if (status === 'ALL') {
            filteredAnimes = allAnimes; 
        } else {
            filteredAnimes = allAnimes.filter(anime => anime.status === status);
        }
        renderAnimes(filteredAnimes); 
    }

    // Filter Animes by EnglishTitle and RomajiTitle
    function filterListedAnimesByName(query) {
        let filteredAnimes;
        filteredAnimes = allAnimes.filter(anime => 
            anime.titleEnglish.toLowerCase().includes(query.toLowerCase()) || 
            anime.titleRomaji.toLowerCase().includes(query.toLowerCase())
        );
            renderAnimes(filteredAnimes); 
    }

    // Filter Animes by EnglishTitle and RomajiTitle on ListedSearchBar Input
    searchInput.addEventListener('input', (event) => {
        const query = event.target.value;
        if (query) {
            filterListedAnimesByName(query);
        } else {
            renderAnimes(allAnimes); 
        }
    });


    //------------------------------------------------ Render Functions ------------------------------------------------ //


    // Injects the MainGrid with AnimesCards
    function renderAnimes(animes) {
        const errorMessage = document.querySelector('.error-message');
        errorMessage.classList.add('hidden');
        const animeContainer = document.querySelector('.grid'); 
        animeContainer.innerHTML = '';
        animes.forEach(anime => {
            const animeDiv = document.createElement('div');
            animeDiv.className = 'relative flex flex-col items-center justify-center w-5/6 space-y-2';
            const progressPerEpisode = (100 / anime.numberOfEpisodes).toFixed(2); 
            const progressPerEpisodeNumber = parseFloat(progressPerEpisode); 
            if (anime.episodeCount == 0){
                var roundedProgress = 0;
            } else {
                var progress = (anime.episodeCount * 100/ anime.numberOfEpisodes).toFixed(2);
                var roundedProgress = parseFloat(progress);
            }

            switch (anime.status) {
                case "PLAN_TO_WATCH":
                    var statusColor = "bg-amber-400 hover:bg-amber-300";
                    break;
                case "WATCHING":
                    var statusColor = "bg-blue-800 hover:bg-blue-700";
                    break;
                case "COMPLETED":
                    var statusColor = "bg-emerald-400 hover:bg-emerald-300";
                    break;
                case "DROPPED":
                    var statusColor = "bg-rose-700 hover:rose-600";
                    break;
            }
            animeDiv.innerHTML = `
                <div class="relative  z-10 group w-5/6 rounded-xl transition-transform duration-200 ease-in-out transform hover:scale-105">
                    <img class="rounded-xl" src="${anime.coverImage}" alt="${anime.titleEnglish}">
                    <button class="absolute top-2 right-2 group-hover:scale-105 w-3 h-3 rounded-full ${statusColor} status-button" onclick="toggleAnimeStatusMenu(this)"></button>
                    <div class="hidden absolute top-8 right-0  bg-white shadow-lg rounded-md p-2" id="options-menu">
                        <button class="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 w-full" onclick="selectOptionFromAnimeStatusMenu(this)"><span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Complete</button>
                        <button class="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 w-full" onclick="selectOptionFromAnimeStatusMenu(this)"><span class="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Watching</button>
                        <button class="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 w-full" onclick="selectOptionFromAnimeStatusMenu(this)"><span class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Plan to Watch</button>
                        <button class="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 w-full" onclick="selectOptionFromAnimeStatusMenu(this)"><span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Drop</button>
                        <button class="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 w-full" onclick="selectOptionFromAnimeStatusMenu(this)"><span class="w-3 h-3 rounded-full bg-black mr-2"></span>Remove</button>

                    </div>
                    <button class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onclick="toggleInfoBox(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h1m0-4h-1m-1 0h-1m4 0h1m-1 4h1v4h-1m-1 4h-1m-1 0h-1m4 0h1m-1 0h-1" />
                        </svg>
                    </button>
                    <div id="info-overlay" class="absolute hidden top-0 bg-gray-800 bg-opacity-75 flex items-center justify-center info-box" onmouseleave="toggleInfoBox(this)">
                        <div class="bg-white rounded-lg p-4 text-black w-auto relative z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-300 hover:scrollbar-thumb-gray-700">
                            <h3 class="font-bold text-lg">${anime.titleEnglish}</h3>
                            <h4 class="font text-sm mt-0">${anime.titleRomaji}</h4>
                            <p class="max-h-24 overflow-y-auto line-clamp-4"><strong>Synopsis:</strong> ${anime.descriptionEnglish}</p>
                            <p><strong>Year:</strong> ${anime.year}</p>
                            <p><strong>Genres:</strong> ${anime.genres.join(', ')}</p>
                            <p><strong>Episodes:</strong> ${anime.numberOfEpisodes}</p>
                            <p><strong>Studio:</strong> ${anime.studios}</p>
                            <p><strong>Author:</strong> ${anime.author || 'N/A'}</p>
                            <p><strong>Source:</strong> ${anime.source || 'N/A'}</p>
                            <p><strong>Director:</strong> ${anime.mainDirector || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <span class="text-slate-50 max-w-full text-sm text-center mt-1">${anime.titleEnglish}</span>
                <div class="flex items-center space-x-2">
                    <button class="text-slate-50" onclick="changeProgressBarAndStatus(this, -${progressPerEpisodeNumber})"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke='#F8FAFC' stroke-width="2" d="M20 12H4" />
                    </svg></button>
                    <div class="w-[10rem] rounded-full bg-gray-700">
                        <div class="progress-bar  ${statusColor} h-full rounded-full text-slate-50 font-light p-0.5 text-xs text-center" style = "width: ${roundedProgress}%;">${roundedProgress}%</div>
                    </div>
                    <button class="text-slate-50" onclick="changeProgressBarAndStatus(this, ${progressPerEpisodeNumber})"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke='#F8FAFC' stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg></button>
                </div>
            `;
            animeContainer.appendChild(animeDiv);
        });
    }

    //Injects the SearchGrid Animes
    function renderSearchAnimes(){
        const searchAnimeInput = document.querySelector('.anime-input');
        const searchValue = searchAnimeInput.value;
        const errorMessage = document.querySelector('.error-message');
        
        if (!searchValue == '') {
            fetchSearchedAnimes(searchValue, 16)
            .then(response => {
                errorMessage.classList.add('hidden');  
                console.log(response);
                if (response.length == 0){
                    errorMessage.classList.remove('hidden');  
                }
                const toggleIcon = document.querySelector('.filter-menu-toggler');
                toggleIcon.classList.add('hidden');
                const searchAnime = document.querySelector('.search-anime');
                searchAnime.classList.add('hidden');
                searchAnimeInput.value = '';
                let animesFounded;
                try {
                    animesFounded = anilistResposeToAnimeTrackerObject(response);
                } catch (error) {
                    errorMessage.classList.remove('hidden');
                }                const animeContainer = document.querySelector('.grid');
                animeContainer.innerHTML = '';
                animesFounded.forEach((anime) => {
                    const animeDiv = document.createElement('div');
                    animeDiv.className = 'relative flex flex-col items-center justify-center w-5/6 space-y-2';
                    animeDiv.innerHTML = `
                        <div class="relative  z-10 group w-5/6 rounded-xl transition-transform duration-200 ease-in-out transform hover:scale-105">
                            <img class="rounded-xl" src="${anime.coverImage}" alt="${anime.titleEnglish}">
                            <button class="absolute top-2 right-2 group-hover:scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bookmark-button" onclick="toggleBookMarkButton(this)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                            </button>
                            <button class="absolute top-2 right-2 group-hover:scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden unbookmark-button" onclick="toggleBookMarkButton(this)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m3 3 1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 0 1 1.743-1.342 48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664 19.5 19.5" />
                                </svg>
                            </button>
                            <button class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onclick="toggleInfoBox(this)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h1m0-4h-1m-1 0h-1m4 0h1m-1 4h1v4h-1m-1 4h-1m-1 0h-1m4 0h1m-1 0h-1" />
                                </svg>
                            </button>
                            <div id="info-overlay" class="absolute hidden top-0 bg-gray-800 bg-opacity-75 flex items-center justify-center info-box" onmouseleave="toggleInfoBox(this)">
                                <div class="bg-white rounded-lg p-4 text-black w-auto relative z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-300 hover:scrollbar-thumb-gray-700">
                                    <h3 class="font-bold text-lg">${anime.titleEnglish}</h3>
                                    <h4 class="font text-sm mt-0">${anime.titleRomaji}</h4>
                                    <p class="max-h-24 overflow-y-auto line-clamp-4"><strong>Synopsis:</strong> ${anime.descriptionEnglish}</p>
                                    <p><strong>Year:</strong> ${anime.year}</p>
                                    <p><strong>Genres:</strong> ${anime.genres.join(', ')}</p>
                                    <p><strong>Episodes:</strong> ${anime.numberOfEpisodes}</p>
                                    <p><strong>Studio:</strong> ${anime.studios}</p>
                                    <p><strong>Author:</strong> ${anime.author || 'N/A'}</p>
                                    <p><strong>Source:</strong> ${anime.source || 'N/A'}</p>
                                    <p><strong>Director:</strong> ${anime.mainDirector || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <span class="text-slate-50 max-w-full text-sm text-center mt-1">${anime.titleEnglish}</span>
            `;
                animeContainer.appendChild(animeDiv);
                });
            })
        } 
    }

    //Injects the Suggested Animes
    function renderSuggestedAnimes(animes){
        const animeContainer = document.querySelector('.suggestion-grid'); 
        animeContainer.innerHTML = '';
        animes.forEach(anime => {
            const animeDiv = document.createElement('div');
            animeDiv.className = 'relative flex flex-col items-center justify-center w-5/6 space-y-2';
            animeDiv.innerHTML = `
                <div class="relative  z-10 group w-8/12 rounded-xl transition-transform duration-200 ease-in-out transform hover:scale-105">
                        <img class="rounded-xl" src="${anime.coverImage}" alt="${anime.titleEnglish}">
                        <button class="absolute top-2 right-2 group-hover:scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300 suggested-button" onclick="addSuggestAnimeToList(this);">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                        </button>
                        </button>
                        <button class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onclick="toggleInfoBox(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h1m0-4h-1m-1 0h-1m4 0h1m-1 4h1v4h-1m-1 4h-1m-1 0h-1m4 0h1m-1 0h-1" />
                            </svg>
                        </button>
                        <div id="info-overlay" class="absolute rounded-lg hidden top-0 w-full bg-gray-800 bg-opacity-75 flex items-center justify-center info-box" onmouseleave="toggleInfoBox(this)">
                            <div class="bg-white rounded-lg p-4 text-black w-auto relative z-50 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-300 hover:scrollbar-thumb-gray-700">
                                <h3 class="font-bold text-lg">${anime.titleEnglish}</h3>
                                <h4 class="font text-sm mt-0">${anime.titleRomaji}</h4>
                                <p class="max-h-24 overflow-y-auto line-clamp-4"><strong>Synopsis:</strong> ${anime.descriptionEnglish}</p>
                                <p><strong>Year:</strong> ${anime.year}</p>
                                <p><strong>Genres:</strong> ${anime.genres.join(', ')}</p>
                                <p><strong>Episodes:</strong> ${anime.numberOfEpisodes}</p>
                                <p><strong>Studio:</strong> ${anime.studios}</p>
                                <p><strong>Author:</strong> ${anime.author || 'N/A'}</p>
                                <p><strong>Source:</strong> ${anime.source || 'N/A'}</p>
                                <p><strong>Director:</strong> ${anime.mainDirector || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <span class="text-slate-50 max-w-full text-sm text-center mt-1">${anime.titleEnglish}</span>
            `;
            animeContainer.appendChild(animeDiv);
        });
    }
