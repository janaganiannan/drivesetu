#include<stdio.h>
#include<stdlib.h>
#define MAX 50
int stack[50];
int top=-1;
void push(){
    int item;
    printf("Enter element to push: ");
    scanf("%d", &item);
    // Implementation for pushing element onto stack
    if(top==MAX-1){
        printf("overflow");
    }
    else{
        top++;
        stack[top]=item;
    }
}
void pop(){
    int pop_element;
    if(top==-1){
        printf("stack underflow");
    }
    else{
        pop_element=stack[top];
        top--;
    }
    printf("element %d is popedout",pop_element);
}
void peek(){
    if(top==-1){
        printf("underflow");
    }
    else{
        printf("element at peak is %d",stack[top]);
    }
}
void display(){
    int i;
    printf("elements in the stack are");
    for(i=top;i>=0;i--){
        printf("%d",stack[i]);
        printf(" ");
    }
}
int  main(){
    int t=1;
    int choice;
    while(t){
     printf(" \nselect the operation from the menu");
     printf("\n1.push\n 2.pop\n 3.peek\n 4.display\n 0.exit\n ");
     scanf("%d",&choice);
     switch(choice)
      {
         case 1: push();
                 break;

         case 2: pop();
                 break;

         case 3: peek();
                 break;

         case 4: display();
                 break;

         case 5: t=0;
                 break;
      }
    }
  
}