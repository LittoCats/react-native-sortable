# Sortable

## Install

```
npm install --save react-native-sortable
```

### Usage

```javascript
state = {
    friends: Array(3).fill().map(_=> Math.random().toString(36).slice(2, 7))
  };

  render() {
    return (
      <Sortable 
        style={styles.container}
        onChangeChildIndex={this._onChangeChildIndex}
      >
        {this.state.friends.map((_, key)=> (
          <Sortable.Item key={key} style={styles.item}>
            <Text style={styles.instructions}>{_ }</Text>
          </Sortable.Item>
        ))}
      </Sortable>
    );
  }

  _onChangeChildIndex = ({oldIndex, newIndex})=> {

    const list = this.state.friends;
    var newlist = list;
    if (newIndex < oldIndex) {
      newlist = list.slice(0, newIndex).concat([list[oldIndex]]).concat(list.slice(newIndex, oldIndex)).concat(list.slice(oldIndex+1));
    }else if (newIndex > oldIndex){
      newlist = list.slice(0, oldIndex).concat(list.slice(oldIndex+1, newIndex+1)).concat([list[oldIndex]]).concat(list.slice(newIndex+1));
    }

    this.setState({
      friends: newlist
    })
  }
```