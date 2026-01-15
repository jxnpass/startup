# Free Bracket Builder

[My Notes](notes.md)

The following application will be a versatile version of a bracket builder. The appeal is to make it free and easy to use as well as adaptable to user needs. Features will include custom themes, access to multiple tourney options (single and double elimination, seeded versus random matchups), and user permissions to specify who can view versus edit in real time. The application will allow the user to manage time with additional inputs: this will allow the user to account for the time it takes to play in a match and how many matches can be played at once. The final product will adapt to both browser and phone templates for viewing.   

## 🚀 Specification Deliverable

> [!NOTE]
>  Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

### Elevator pitch

Free Bracket Builder will be an easy-to-use and quick version of a bracket builder, which will automatically slot participants in a tournament of the user's specifications. Unlike existing applications, this one will be free to use, contain custom themes, and grant unlimited access to typical specifications when creating a tourney (single and double elimination, seeded versus random matchups). The application will boast time management utilities for the user that other apps fail to include, which will account for both the time it takes to play a match as well as how many matches can be played at once. The final product will adapt to both browser and phone templates to be flexible for readers.   

### Design

![Design image 1](img/wb1.png)
![Design image 2](img/wb2.png)

```mermaid
sequenceDiagram
    actor Owner
    actor Editors
    actor Viewers
    Owner->>Server: Creates and edits bracket, shares it with specified users
    Server-->Editors: Receives bracket
    Server-->Viewers: Receives bracket
    Editors->>Server: Edits bracket
    Server-->Owner: Receives new bracket
    Server-->Viewers: Receives new bracket
```

### Key features

- Secure login over HTTPS
- Determine bracket framework, including title, type, team number, seeds, and other essential elements
- Optional choices for themes, time management components (optional depending on time and resources), and sharing options
- Easy editing for each match for time and location of match
- Sharing options expanded to include co-editors and viewers
- Bracket edits are persistently saved and stored in DB

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Uses HTML structure for application. Four HTML pages: one for login, one for bracket creation, one for bracket structure, and the last containing all brackets the user is shared to.
- **CSS** - Styling for easy usage of bracket creation, choice colors and contrasts used for theme selection. 
- **React** - Login details, interaction with building, editing, and updating the bracket.  
- **Service** - Endpoints for login credentials, send sharing permissions, submitting and retrieving bracket formats and information, API call for theme palettes
- **DB/Login** - Store users, choices, and bracket info in database. Register and login users. Credentials securely stored in database. Can't edit brackets unless authenticated. 
- **WebSocket** - As brackets are created and shared, specified users are granted access. If brackets are made public, then no credentials are needed. 

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [bracketbuilder.click](https://bracketbuilder.click).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **HTML pages** - I did not complete this part of the deliverable.
- [ ] **Proper HTML element usage** - I did not complete this part of the deliverable.
- [ ] **Links** - I did not complete this part of the deliverable.
- [ ] **Text** - I did not complete this part of the deliverable.
- [ ] **3rd party API placeholder** - I did not complete this part of the deliverable.
- [ ] **Images** - I did not complete this part of the deliverable.
- [ ] **Login placeholder** - I did not complete this part of the deliverable.
- [ ] **DB data placeholder** - I did not complete this part of the deliverable.
- [ ] **WebSocket placeholder** - I did not complete this part of the deliverable.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Header, footer, and main content body** - I did not complete this part of the deliverable.
- [ ] **Navigation elements** - I did not complete this part of the deliverable.
- [ ] **Responsive to window resizing** - I did not complete this part of the deliverable.
- [ ] **Application elements** - I did not complete this part of the deliverable.
- [ ] **Application text content** - I did not complete this part of the deliverable.
- [ ] **Application images** - I did not complete this part of the deliverable.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
