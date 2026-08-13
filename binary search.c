#include<stdop.h>
int main(){
    int i,n;
    printf("enter no of elements to be inserted");
    int p[50];
    for(i=0,i<n;i++){
     scanf("%d",&p);
    }
    int target;
    printf("enter the element you want to search ");
    scanf("%d",target);
    int low=p[0];
    int high=p[n-1];
    int mid=low+high)/2;
    int k=1;
    while(low<=high){
        mid=(low+high)/2;
        if(mid=target){
            printf("elment found at %d position  ",k);

            return 0;
        }
        else if(mid<target){
            low=mid+1;
        }
        else{
            high=mid-1;
        }
        k++;
    }
}