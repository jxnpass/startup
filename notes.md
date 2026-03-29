# CS 260 Notes

[My startup - Simon](https://simon.cs260.click)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## AWS

<!--  My IP address is: 34.231.90.41 -->
Launching my AMI I initially put it on a private subnet. Even though it had a public IP address and the security group was right, I wasn't able to connect to it.

I can access the server files using  
```
ssh -i ~/pathtokey.pem ubuntu@bracketbuilder.click
```

Starting a AWS instance requires I do the following:
1. set up an instance 
2. create an elastic IP
3. set up a domain name / DNS
4. connect the domain name to the public IP address

These use the AWS apps EC2 and Route53

## Caddy

No problems worked just like it said in the [instruction](https://github.com/webprogramming260/.github/blob/main/profile/webServers/https/https.md).

Software allows for free private encryption. Should use Caddy in the future. 

## HTML

This was easy. I was careful to use the correct structural elements such as header, footer, main, nav, and form. The links between the various views work great using the `a` element. 

The "Create a Bracket Page" had the major parts of the HTML structure. Here I used a lot of those user options/interactive elements. These will create variables that build the bracket.

The list of brackets page and the bracket itself will require some extensive JavaScript code. Something that may be a struggle later. 


## CSS

The CSS was tough. Not a natural coder at that. But, from the first impression it looks like what I want it to: clean, easy to read, and interesting. 

Each HTML page has its own CSS formatting, where main.css is referenced, and then additional elements are carried into from the specific CSS file it references afterward. Bootstrap helped with missing pieces.

I will need to fix the bracket page a bit more to make it look exactly how I want it, but for now it will do for this assignment.


## React Part 1: Routing

Setting up Vite and React was pretty simple. I had a bit of trouble because of conflicting CSS. 

I started by creating the right structure that vite would expect: initializing repositories called public and src. The public stores my favicon, while src stores my JSX and CSS files. These all formulate a network for which the app can pull pages of content. What I really like most about this is that the header and footer can stay consistently on one page, while my app content can change as I navigate tabs.

## React Part 2: Reactivity

This was a lot of fun to see it all come together. The trickiest part was handling the bracket lines, but eventually it came together. 

Ultimately, what was most exciting was seeing how a local storage system can save multiple brackets and retain the progress-state of the bracket. This will be very cool, and can make sharing brackets across users very easy since each bracket will have its own link to view. Having mulitple users edit the bracket will be a tricky component to detail. 

Another satisfying component was the link from creation of the bracket to the actual bracket itself. I used a JSON format to essentially have the bracketStructure.js or roundRobin.js files essentially read in the information from the bracketDraft.js file and essentially impute values. That will be a very nice feature when I eventually get into user-by-user data storage, where I can just save elements of the bracket / progress state. 

## Service

This one was pretty straightforward, and was clear how to create a separate port to essentially handle backend processes (and store these functions and data under the service folder). However, getting it to deploy was tricky, as now there are two ports with two separate packages that need to be instilled. 

Handling the API call was also fairly straightforward. I decided to make use of the "useless facts" API, simply because APIs tend to either require signing up for an API key, or are completely shutdown by the owners, so I went with a call that was low-risk and low-maintenance with an unlimited number of API calls allowed per month. 

## DB

This one just required edits from a local storage system to a hashed out database. In this case, the class requested I use MongoDB to integrate bracket information into a server, and it works perfectly since the way I set up the data info of each bracket was in the form of a json file! That made those changes very easy, just had to connect each add, update, delete, etc. to the server. 

