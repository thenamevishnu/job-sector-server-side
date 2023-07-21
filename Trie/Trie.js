class Node{
    constructor(){
        this.child = {}
        this.isEnd = false
    }
}

class MainClass{
    constructor(){
        this.root = new Node()
    }

    UploadArray(array){
        for(let elements of array){
            let currentNode = this.root
            for(let i=0;i<elements.length;i++){
                const letter = elements[i]
                if(!(letter in currentNode.child)){
                    currentNode.child[letter]=new Node()
                }
                currentNode=currentNode.child[letter]
            }
            currentNode.isEnd=true
        }
    }

    __traverse(currentNode,prefix,words){
        if(currentNode.isEnd){
            words.push(prefix)
        }
        for(let child in currentNode.child){
            this.__traverse(currentNode.child[child],prefix + child,words)
        }
        return words
    }

    searchResponse(prefix){
        let currentNode=this.root
        for(let i=0;i<prefix.length;i++){
            const letter = prefix[i]
            if(!(letter.toUpperCase() in currentNode.child) && !(letter.toLowerCase() in currentNode.child)){
                return []
            }
            currentNode=currentNode.child[letter.toLowerCase()] ? currentNode.child[letter.toLowerCase()] : currentNode.child[letter.toUpperCase()]
        }
        return this.__traverse(currentNode,prefix,[])
    }
}

export const prefix = new MainClass()