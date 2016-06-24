/**
 * created by chenletian on 16/5/21.
 */

var PCControllers = angular.module('PCControllers', [
    'ngStorage',
    'PCServices',
    'infinite-scroll'
]);
PCControllers
.controller('indexController', ['$scope', '$location', 'User', 'Group', 'UserRelation', 'GroupRelation', 'Talking',
    function ($scope, $location, User, Group, UserRelation, GroupRelation, Talking) {
    if(!User.getCurrentUser()) {
        $location.path('#/login');
        return;
    }
    User.query(User.getCurrentUser().uid, function (res) {
        $scope.me = res.data.data;
        UserRelation.queryFollows({uid: $scope.me.uid}, function (res) {
            $scope.me.follows = res.data.users.length + res.data.groups.length;
            $scope.groups = res.data.groups;
            function getGroupInfo(index) {
                Group.get({gid: $scope.groups[index].gid}, function (res) {
                    $scope.groups[index].gname = res.data.gname;
                    $scope.groups[index].avatar = res.data.avatar;
                });
            }
            for (var index in res.data.groups){
                getGroupInfo(index);
            }
        });
        UserRelation.queryFollowers({uid: $scope.me.uid}, function (res) {
            $scope.me.followers = res.data.length;
        });
        Talking.userCountGet({uid: $scope.me.uid}, function (res) {
            $scope.me.talkings = res.data;
        });
    });
    $scope.name = "index"
}])
.controller('loginController', ['$scope', '$location', 'User', '$timeout', function ($scope, $location, User, $timeout) {
    $scope.indicator = 'Log in';
    $scope.loading = false;
    $scope.failed = false;
    $scope.login = function() {
        var uname = $scope.uname;
        var password = $scope.password;
        $scope.loading = true;
        User.login(uname, password, function successCallback(response) {
            $scope.indicator = '登录成功! 正在跳转.';
            $timeout(function () {
                $scope.indicator = '登录成功! 正在跳转..';
            }, 500);
            $timeout(function () {
                $scope.indicator = '登录成功! 正在跳转...';
            }, 1000);
            $timeout(function () {
                $location.path('/');
            }, 1500);
            $scope.loading = false;
        }, function errorCallback(response) {
            $scope.indicator = '登录失败,' + response.data.msg;
            $scope.failed = true;
            $timeout(function () {
                $scope.indicator = 'Log in';
                $scope.failed = false;
            }, 2000);
            $scope.loading = false;
        });
    };
}])
.controller('signupController', ['$scope', '$location', 'User' , '$timeout', function ($scope, $location, User, $timeout) {
    $scope.indicator = 'Sign Up';
    $scope.loading = false;
    $scope.failed = false;
    $scope.signup = function() {
        $scope.loading = true;
        var uname = $scope.uname;
        var password = $scope.password;
        var nickname = $scope.nickname;
        var signature = $scope.signature;
        var enrollmentYear = $scope.enrollmentYear;
        User.save({uname: uname, password: password, nickname: nickname, signature: signature, enrollmentYear: enrollmentYear}, function(response) {
            $scope.indicator = '注册成功! 正在跳转.';
            $timeout(function () {
                $scope.indicator = '注册成功! 正在跳转..';
            }, 500);
            $timeout(function () {
                $scope.indicator = '注册成功! 正在跳转...';
            }, 1000);
            $timeout(function () {
                $location.path('login');
            }, 1500);
            $scope.loading = false;
        }, function (response) {
            $scope.indicator = '注册失败' + response.data.msg;
            $scope.failed = true;
            $timeout(function () {
                $scope.indicator = 'Sign Up';
                $scope.failed = false;
            }, 2000);
            $scope.loading = false;
        });
    };
    $scope.$watch('uname', function(newValue, oldValue, scope) {
        if (scope.nickname == oldValue) {
            scope.nickname = newValue;
        }
    });
}])
.controller('youMayBeKnowController', ['$scope', 'UserRelation', 'User', function ($scope, UserRelation, User) {
    if (!User.getCurrentUser()) return;

    UserRelation.maybeknow(function (response) {
        $scope.persons = response.data;
        function getUserInfo(index) {
            User.query($scope.persons[index].uid, function (res) {
                $scope.persons[index].nickname = res.data.data.nickname;
                $scope.persons[index].avatar = res.data.data.avatar;
                User.query($scope.persons[index].mid, function (res2) {
                    $scope.persons[index].midNick = res2.data.data.nickname;
                });
            });
        }
        for (var index in $scope.persons) getUserInfo(index);
    });
}])
.controller('homepageTalkingsController', ['$scope', 'Talking', 'User', 'Group', '$interval', function ($scope, Talking, User, Group, $interval) {
    if (!User.getCurrentUser()) return;

    var lastUpdateTime;
    var currentPage = 0;
    var pages = 0;

    $scope.contents = [];
    $scope.hasNextPage = false;
    $scope.hasNew = false;
    $scope.newCount = 0;
    $scope.busy = false;

    Date.prototype.format = function(fmt) {
        var o = {
            "M+" : this.getMonth()+1,                 //月份
            "d+" : this.getDate(),                    //日
            "h+" : this.getHours(),                   //小时
            "m+" : this.getMinutes(),                 //分
            "s+" : this.getSeconds(),                 //秒
            "q+" : Math.floor((this.getMonth()+3)/3), //季度
            "S"  : this.getMilliseconds()             //毫秒
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt;
    };

    function getUserInfo(Array, index) {
        Array[index].timestamp = new Date(Array[index].timestamp).format("yyyy-MM-dd hh:mm:ss");
        User.query(Array[index].user_uid, function (res) {
            Array[index].user_nickname = res.data.data.nickname;
            Array[index].user_avatar = res.data.data.avatar;
        });
        if(Array[index].group_gid){
            Group.get({gid: Array[index].group_gid}, function (res) {
                Array[index].group_gname = res.data.gname;
            });
        }
    }

    $scope.getNextPageContents = function () {
        $scope.busy = true;
        ++currentPage;
        if (currentPage == 1) lastUpdateTime = Math.round(new Date().getTime() / 1000);

        Talking.query((currentPage == 1) ? null : {page: currentPage}, function (response) {
            var newRows = response.data.rows;
            for (var index in newRows) getUserInfo(newRows, index);
            $scope.contents = $scope.contents.concat(newRows);
            if(response.data.pages) pages = response.data.pages;
            $scope.hasNextPage = pages > currentPage;
            $scope.busy = false
        });

    };

    $scope.getNewContents = function () {
        Talking.query({after: lastUpdateTime}, function (response) {
            var newRows = response.data.rows;
            for (var index in newRows) getUserInfo(newRows, index);
            $scope.contents = newRows.concat($scope.contents);
            $scope.hasNew = false;
        });
        lastUpdateTime = Math.round(new Date().getTime() / 1000);
    };

    $scope.getNextPageContents();

    var interval = $interval(function () {
        Talking.queryCount({after: lastUpdateTime}, function (response) {
            $scope.newCount = response.data;
            $scope.hasNew = $scope.newCount > 0;
        });
    }, 10 * 1000
    );

    $scope.$on("$destroy", function() {
        $interval.cancel(interval);
    });

}])
.controller('navController', ['$scope', 'User', function ($scope, User) {
    $scope.logout = function () {
        User.logout();
    }
}])
.controller('talkingPostController', ['$scope', 'Talking', 'Group', 'GroupRelation', '$timeout', function ($scope, Talking, Group, GroupRelation, $timeout) {
    $scope.topicSelecting = false;
    $scope.submit = function () {
        //创建话题
        if ($scope.gid == -1) {
            Group.save({gname: $scope.gname}, function (res) {
                $scope.gid = res.data.gid;
                submitNext();
            });
        } else submitNext();

        function submitNext() {
            //关注话题
            if($scope.gid) GroupRelation.save({gid: $scope.gid}, null);

            var rawText = $scope.text;
            Talking.save({text: rawText, gid: $scope.gid, image: $scope.image},function () {
                $scope.text = "";
                $scope.topicSelecting = false;
                $scope.gid = undefined;
                $scope.image = undefined;
                alert('您的说说发布成功!');
            },function (res) {
                alert('您的说说发布失败!');
            });
        }
    };

    $scope.selectTopic = function () {
        $scope.topicSelecting = !$scope.topicSelecting;
        if(!$scope.topicSelecting) {
            $scope.gid = undefined;
            $scope.gname = undefined;
            $scope.topicInput = undefined;
        }
    };

    $scope.topicSelected = function (gid, gname) {
        $scope.gid = gid;
        $scope.gname = gname;
        $scope.topicInput = gname;
        $scope.groupResult = undefined;
    };

    var timeout;
    $scope.$watch('topicInput', function(newValue, oldValue, scope) {
        $timeout.cancel(timeout);
        if(!newValue) {
            scope.groupResult = undefined;
            return;
        }
        //用timeout减少输入时的网络请求次数
        timeout = $timeout(function () {
            Group.query({gname: newValue}, function (res) {
                if(res.data.length == 0) res.data = [{gid: -1, gname: newValue}];
                else for (var index in res.data) {
                    if (res.data[index].gname == newValue) break;
                    if(index == res.data.length - 1) {
                        res.data = res.data.concat([{gid: -1, gname: newValue}]);
                    }
                }
                scope.groupResult = res.data;
            });
        }, 100);

    });
}]);