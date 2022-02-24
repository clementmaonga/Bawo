var Game = (function() {
	function Game(type, level) {
		this.type = ["basic", "advanced"][type];
		this.level = ["easy", "medium", "hard"][level];
		this.firstPlay = null;
		this.currentPlayer = null;
		this.opponent = null;
		this.winner = null;
		this.loser = null;
		this.relayCounter = 0;
		this.breakRelay = false;
		this.settings = {
			sound: false,
			rotate: true,
			moveHighlighter: false,
			animation: 400
		};
	}
	Game.prototype = {
		constructor: Game,
		possibleLayouts: function() {
			var list = layouts()
			  , initial = [list[9971], list[1706], list[3240], list[1782], list[3623]];
			return [initial, layouts()];
		},
		initialSetUp: function() {
			var gameInfo = [], setUp, reserve, mtagiPhase, namuaPhase, _this = this;
			if (this.type === "basic") {
				setUp = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
				reserve = 0;
				mtagiPhase = true;
				namuaPhase = false;
			} else if (this.type === "advanced") {
				setUp = [0, 2, 2, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				reserve = 20;
				mtagiPhase = false;
				namuaPhase = true;
			}
			[this.currentPlayer, this.opponent].forEach(function(player) {
				var playerPits = setUp, playerTurn;
				if (_this.winner !== null) {
					if (player.boardSide === _this.winner.boardSide) {
						playerTurn = true;
					} else if (player.boardSide === _this.loser.boardSide) {
						playerTurn = false;
					}
				} else {
					playerTurn = player.turn;
				}
				var playerProperties = {
					"name": player.name,
					"turn": playerTurn,
					"currentPits": playerPits,
					"lifeForm": player.lifeForm,
					"boardSide": player.boardSide,
					"mtagiPhase": mtagiPhase,
					"namuaPhase": namuaPhase,
					"relayMode": false,
					"takataMode": false,
					"taxMode": false,
					"houseStrippedPowers": false,
					"reserve": reserve,
					"collectingSeeds": false,
					"freeSowingSeeds": false,
					"houseResting": undefined
				};
				gameInfo.push(playerProperties);
			});
			localStorage.setItem("bawoPlayInfo", JSON.stringify(gameInfo));
			this.loadProgress();
			return this;
		},
		loadProgress: function(progress) {
			if (progress == void 0) {
				progress = false;
			}
			var _this = this;
			var info = progress ? progress : JSON.parse(localStorage.getItem('bawoPlayInfo'));
			if (localStorage.getItem('bawoPlayInfo')) {
				var bawoPlayInfo = info
				  , bawoPlayers = [];
				bawoPlayInfo.forEach(function(player) {
					var bawoPlayer = Player(player.name, player.boardSide, player.lifeForm);
					for (var property in player) {
						bawoPlayer[property] = player[property];
					}
					for (var i = 0; i < player.currentPits.length; i++) {
						$(".side-" + bawoPlayer.boardSide + " .pit[data-position=\"" + i + "\"]").data("pit-seeds", "" + bawoPlayer.currentPits[i]);
						bawoPlayer.insertSeeds(i, bawoPlayer.currentPits[i], false);
					}
					if (bawoPlayer.turn) {
						_this.currentPlayer = bawoPlayer;
					} else {
						_this.opponent = bawoPlayer;
					}
					bawoPlayers.push(bawoPlayer);
					if (bawoPlayer.reserve !== 0) {
						bawoPlayer.insertSeeds(0, bawoPlayer.reserve, true);
					} else {
						$(".side-" + player.boardSide + " .seeds-reserve").empty();
					}
				});
				if (this.gameOver()) {
					this.initialSetUp();
				} else {
					this.currentPlayer.playMode(this.opponent);
				}
			} else {
				this.saveProgress();
			}
			return this;
		},
		saveProgress: function() {
			var gameInfo = []
			  , _this = this;
			[this.currentPlayer, this.opponent].forEach(function(player) {
				player.currentPits = [];
				for (var i = 0; i < 16; i++) {
					player.currentPits.push(Number($(".side-" + player.boardSide + " .pit[data-position=\"" + i + "\"]").data("pit-seeds")));
				}
				//_this.log.set(player.name +" board",player.currentPits);
				gameInfo.push(player);
			});
			localStorage.setItem("bawoPlayInfo", JSON.stringify(gameInfo));
			return this;
		},
		seekHistory: function(backwards) {
			var seekState = JSON.parse(localStorage.getItem("bawoPlayInfo"))
			  , manager = JSON.parse(localStorage.getItem("gameManager"));
			if (backwards && this.playHistory.exist()) {
				this.playHistory.set(seekState, true).remove();
				this.loadProgress(manager.previousState);
			} else if (!backwards && this.playHistory.exist(true)) {
				this.playHistory.set(seekState).remove(true);
				this.loadProgress(manager.nextState);
			}
			this.saveProgress().boardreflectCurrent(true);
			this.currentPlayer.playMode(this.opponent);
		},
		playHistory: {
			exist: function(forward) {
				var manager = JSON.parse(localStorage.getItem("gameManager"));
				if (forward) {
					return manager.nextState ? true : false;
				} else {
					return manager.previousState ? true : false;
				}
			},
			set: function(state, forward) {
				var savedState = state
				  , gameManager = JSON.parse(localStorage.getItem("gameManager"));
				if (forward) {
					gameManager["nextState"] = savedState;
				} else {
					gameManager["previousState"] = savedState;
				}

				localStorage.setItem("gameManager", JSON.stringify(gameManager));
				return this;
			},
			remove: function(forward) {
				var gameManager = JSON.parse(localStorage.getItem("gameManager"));
				if (gameManager !== null) {
					if (forward) {
						gameManager["nextState"] = undefined;
					} else {
						gameManager["previousState"] = undefined;
					}

					localStorage.setItem("gameManager", JSON.stringify(gameManager));
				}
				return this;
			}
		},
		log: {
			create: function() {
				localStorage.setItem("bawoLogFile", JSON.stringify([]));
			},
			set: function(action, description) {
				if (!localStorage.getItem("bawoLogFile")) {
					this.create();
				}
				var bawoLogFile = JSON.parse(localStorage.getItem("bawoLogFile"))
				  , item = {};
				item[action] = description;
				bawoLogFile.push(item);
				localStorage.setItem("bawoLogFile", JSON.stringify(bawoLogFile));
			},
			remove: function() {
				localStorage.removeItem("bawoLogFile");
			},
			get: function() {
				localStorage.getItem("bawoLogFile");
			}
		},
		switchPlayers: function() {
			this.currentPlayer.turn = false;
			this.opponent.turn = true;
			var _a = [this.opponent, this.currentPlayer];
			this.currentPlayer = _a[0];
			this.opponent = _a[1];
			this.currentPlayer.setPhase();
			this.relayCounter = 0;
			if (!this.gameOver()) {
				this.currentPlayer.playMode(this.opponent);
			}
			this.saveProgress().loadProgress().boardreflectCurrent(true);
			return this;
		},
		gameOver: function() {
			var gameEnd = false;
			if (this.currentPlayer.lost()) {
				this.winner = this.opponent;
				this.loser = this.currentPlayer;
				gameEnd = true;
			} else if (this.opponent.lost()) {
				this.winner = this.currentPlayer;
				this.loser = this.opponent;
				gameEnd = true;
			}
			if (gameEnd) {
				this.log.set("Game Over", this.winner.name + " won," + this.loser.name + " lost");
				this.playHistory.remove().remove(true);
				var _a = [this.winner, this.loser];
				this.currentPlayer = _a[0];
				this.firstPlay = _a[0].boardSide;
				this.opponent = _a[1];
				var title = "Game Over"
				  , body = this.winner.isAI() ? "You have lost to an AI" : "Congratulations " + this.winner.name + "! You have won."
				  , footer = "<div class=\"d-flex justify-content-between w-100\"><div class=\"btn btn-default game-restart ended mr-5  w-100\">Replay</div><div class=\"btn btn-default new-player  w-100 ml-5\">Exit</div></div>";
				Dialog(title, body, footer, false).open();
				return true;
			} else {
				return false;
			}
		},
		taxSeeds: function(direction) {
			var _this = this;
			game.log.set("Taxing the House", "Seeds taxed to the " + direction);
			for (var i = 1; i <= 2; i++) {
				(function(i, direction, $, _this) {
					setTimeout(function() {
						var sign = (direction === "right") ? 3 - i : 3 + i;
						$(".side-" + _this.currentPlayer.boardSide + " .pit[data-position=\"" + sign + "\"]").data("pit-seeds", "1");
						_this.currentPlayer.insertSeeds(sign, 1, false);
						if (i === 2) {
							var housePit = $(".side-" + _this.currentPlayer.boardSide + " .pit[data-position=\"3\"]")
							  , housePitSeeds = housePit.data("pit-seeds")
							  , remainingSeeds = Number(housePitSeeds) - 2;
							housePit.data("pit-seeds", "" + remainingSeeds);
							$(".pit").removeClass("active");
							_this.currentPlayer.insertSeeds(3, remainingSeeds, false);
							_this.currentPlayer.decreaseReserve().taxOff();
							_this.switchPlayers().saveProgress();
						}
					}, (_this.settings.animation * i));
				}
				)(i, direction, $, _this);
			}
		},
		boardreflectCurrent: function(moveAI) {
			if (moveAI === void 0)
				moveAI = false;
			var _this = this
			  , playerSide = this.currentPlayer.boardSide
			  , opponentSide = this.opponent.boardSide;
			$(".player-side.side-" + playerSide).removeClass("opponent").addClass("current-player");
			$(".player-side.side-" + opponentSide).removeClass("current-player").addClass("opponent");
			$(".side-" + playerSide + " .player-avatar").html(icons.activeAvatar);
			$(".side-" + playerSide + " .player-name").html(this.currentPlayer.name);
			$(".side-" + opponentSide + " .player-name").html(this.opponent.name);
			$(".side-" + opponentSide + " .player-avatar").html(icons.avatar);
			$(".side-" + playerSide + " .player-avatar").addClass("active");
			$(".side-" + opponentSide + " .player-avatar").removeClass("active");
			$(".side-" + playerSide + ".footer").show();
			$(".side-" + opponentSide + ".footer").hide();
			if (!$(".pit.active").found()) {
				$(".move").find("svg").css("transform", "rotate(0deg)");
				$(".move").addClass("disabled");
			}
			if (_this.currentPlayer.isAI()) {
				$(".side-" + playerSide + " .player-avatar").html(icons.laptop);
				$(".side-" + playerSide + " .player-timeline").hide();
			} else {
				$(".side-" + playerSide + " .player-timeline").show();
			}
			$(".side-" + playerSide + ".footer .move-control").hide();
			var stickPosition = "bottom";
			if (playerSide === "a" && _this.autoRotate()) {
				$(".board").addClass("rotate-180");
				$(".modal").removeClass("rotate-180");
				$(".settings-page").removeClass("reflect-a");
				$(".side-" + playerSide + ".footer").addClass("auto-rotate-controls");
			} else if (playerSide === "a" && !_this.autoRotate()) {
				$(".board").removeClass("rotate-180");
				if (_this.currentPlayer.isHuman())
					$(".modal").addClass("rotate-180");
				$(".settings-page").addClass("reflect-a");
				$(".side-" + playerSide + ".footer").removeClass("auto-rotate-controls");
				stickPosition = "top";
			} else {
				$(".board, .modal").removeClass("rotate-180");
				$(".settings-page").removeClass("reflect-a");
				$(".side-" + opponentSide + ".footer").removeClass("auto-rotate-controls");
			}
			centerFooter(_this.currentPlayer, stickPosition);
			setTimeout(function() {

				if (!$(".modal").hasClass("open")) {
					if (_this.currentPlayer.isAI() && moveAI)
						initiateMove(_this);
				}
			}, 1000);
			return this;
		},
		saveSettings: function() {
			var soundToggle = $(".enable-sounds .slider-input").get(0)
			  , rotateToggle = $(".auto-rotate .slider-input").get(0)
			  , moveHighlighter = $(".move-highlighter .slider-input").get(0)
			  , animationDelay = Number($(".delay-value").data("delay-value"));
			this.settings = {
				sound: soundToggle.checked,
				rotate: rotateToggle.checked,
				moveHighlighter: moveHighlighter.checked,
				animation: animationDelay
			};
			var manager = JSON.parse(localStorage.getItem("gameManager"));
			manager["settings"] = this.settings;
			localStorage.setItem("gameManager", JSON.stringify(manager));
			this.setSettings();
			this.log.set("New settings", this.settings);
			console.log(this.settings);
			return this;
		},
		setSettings: function() {
			if (localStorage.getItem("gameManager")) {
				var manager = JSON.parse(localStorage.getItem("gameManager"));
				$(".enable-sounds .slider-input").get(0).checked = manager.settings.sound;
				$(".auto-rotate .slider-input").get(0).checked = manager.settings.rotate;
				$(".move-highlighter .slider-input").get(0).checked = manager.settings.moveHighlighter;
				$(".delay-value").data("delay-value", "" + manager.settings.animation);
				$(".delay-value").html(manager.settings.animation);
				this.settings = {
					sound: manager.settings.sound,
					rotate: manager.settings.rotate,
					moveHighlighter: manager.settings.moveHighlighter,
					animation: manager.settings.animation
				};
				this.boardreflectCurrent(false);
			} else {
				this.saveSettings();
			}
			return this;
		},
		autoRotate: function() {
			return this.settings.rotate;
		},
		setFreeSow: function(target, mode) {
			var totalFreeSow;
			if (!$(".freesow").found()) {
				$(".side-" + this.currentPlayer.boardSide + " .player-timeline").prepend("<div class=\"freesow d-flex\" data-freesow=\"0\"></div>");
			}
			var freeSow = $(".freesow")
			  , targetPosition = Number(target.data("position"));
			if (mode === "collecting") {
				var allowedPits = this.currentPlayer.validMoves(this.opponent);
				if (allowed(targetPosition, null, allowedPits) || Number(target.data("pit-seeds")) > 0) {
					target.toggleClass("active");
					if (targetPosition === 3 && Number(target.data("pit-seeds")) > 8) {
						totalFreeSow = (Number(target.data("pit-seeds")) - 8) + Number(freeSow.data("freesow"));
						;this.currentPlayer.insertSeeds(targetPosition, 8, false);
						target.data("pit-seeds", "8");
					} else {
						if (Number(freeSow.data("freesow")) < 1) {
							totalFreeSow = Number(target.data("pit-seeds")) + 1;
						} else {
							totalFreeSow = Number(target.data("pit-seeds")) + Number(freeSow.data("freesow"));
						}
						target.html("");
						target.data("pit-seeds", "0");
					}

					freeSow.data("freesow", totalFreeSow);
					freeSow.html("");
					for (var i = 1; i <= totalFreeSow; i++) {
						freeSow.append("<div class=\"sow-amount side-" + this.currentPlayer.boardSide + "\">" + i + "</div>");
					}
					target.toggleClass("active");
				} else if (targetPosition === 3) {
					console.log("You cannot take contents of your house for free sow, you can only add to it.");
				} else {
					console.log("Collect any or all 2 seeds from 2 pits right of your house for free sow.");
				}
			} else if (mode === "sowing") {
				$(".seeds-reserve.active").removeClass("active");
				var activeSowAmount = $(".sow-amount.active")
				  , totalSown = Number(activeSowAmount.html()) + Number(target.data("pit-seeds"))
				  , remainToSow = freeSow.data("freesow") - Number(activeSowAmount.html());
				freeSow.data("freesow", remainToSow);
				freeSow.html("");
				for (var j = 1; j <= remainToSow; j++) {
					freeSow.append("<div class=\"sow-amount side-" + this.currentPlayer.boardSide + "\">" + j + "</div>");
				}
				//Adding seed
				target.data("pit-seeds", "" + totalSown);
				this.currentPlayer.insertSeeds(Number(target.data("position")), totalSown, false);
				if (remainToSow === 0) {
					this.playHistory.set(JSON.parse(localStorage.getItem("bawoPlayInfo"))).remove(true);
					this.currentPlayer.collectingSeeds = false;
					this.currentPlayer.freeSowingSeeds = false;
					freeSow.remove();
					this.currentPlayer.decreaseReserve().relayOff();
					this.switchPlayers();
				}
			}
		},
		relayAfterSeedInsert: function(finalSowPit, calculatedSteps, direction) {
			var _this = this;
			_this.currentPlayer.insertSeeds(finalSowPit, calculatedSteps, false);
			setTimeout(function() {
				_this.relaySeeds(direction, finalSowPit);
			}, this.settings.animation);
		},
		relayComplete: function() {
			$(".pit").removeClass("active allowed-pit");
			var _this = this;
			this.currentPlayer.decreaseReserve().relayOff();
			this.relayCounter = 0;
			this.breakRelay = false;
			this.playHistory.set(JSON.parse(localStorage.getItem("bawoPlayInfo"))).remove(true);
			this.saveProgress();
			if (!this.gameOver()) {
				setTimeout(function() {
					_this.switchPlayers();
				}, this.settings.animation);
			}
			return this;
		},
		relaySeeds: function(direction, departingPoint) {
			if (this.relayCounter === 0) {
				this.log.set(this.currentPlayer.name + " move", {
					direction: departingPoint > 7 && direction == "right" || departingPoint < 8 && direction == "left" ? "left" : "right",
					pit: departingPoint + 1
				});
			}
			this.relayCounter++;
			var game = this, currentPlayer = game.currentPlayer, opponent = game.opponent, finalSowPit, cutoffPit = 16, totalSteps = game.calculatedSteps;
			$(".side-" + game.currentPlayer.boardSide + " .move-control").hide();
			if (this.relayCounter >= 100) {
				if (this.currentPlayer.isAI()) {
					this.breakRelay = true;
				} else {
					if (!$(".toast").hasClass("active")) {
						$(".toast").append("<div><div class=\"mb-10\">This move will not come to an end naturally. Sleep at an end of current relay will be activated in <span class=\"relay-time bold\">Time Remaining</span></div><div class=\"btn relay-sleep\">Activate now</div></div>");
						$(".toast").addClass("active").removeClass("top-0,bottom-0, rotate-180");
						if (this.autoRotate() || this.currentPlayer.boardSide === "b") {
							$(".toast").addClass("bottom-0");
						} else {
							$(".toast").addClass("top-0, rotate-180");
						}
						var relapse = 60;
						for (var j = 1; j <= relapse; j++) {
							(function(j) {
								setTimeout(function() {
									if (j === relapse) {
										game.breakRelay = true;
										$(".toast").removeClass("active").html("");
									}
									$(".relay-time").html(relapse - j + "s");
								}, j * 1000);
							}
							)(j);
						}
					}
				}
			}
			if (departingPoint > -1) {
				$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + departingPoint + "\"]").data("pit-seeds", "0");
				$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + departingPoint + "\"]").html("");
				currentPlayer.currentPits[departingPoint] = 0;
			} else if (departingPoint === -8) {
				departingPoint = departingPoint * -1;
			}
			$(".pit").removeClass("active allowed-pit");
			for (var i = 1; i <= totalSteps; i++) {
				(function(i, game, totalSteps, direction, departingPoint, properSowPit, $, currentPlayer, finalSowPit, opponent, Dialog) {
					setTimeout(function() {
						game.calculatedSteps = totalSteps - i;
						var sowPit = properSowPit(i, departingPoint, direction);
						$(".pit").removeClass("active");
						var currentSowPit = $(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + sowPit + "\"]")
						  , newSeedTotal = Number(currentSowPit.data("pit-seeds")) + 1;
						currentPlayer.currentPits[sowPit] = newSeedTotal;
						currentPlayer.insertSeeds(sowPit, newSeedTotal, false);
						if (totalSteps === i) {
							finalSowPit = sowPit;
							var finalPit = finalSowPit
							  , capturePosition = 7 - sowPit
							  , restingPit = $(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalSowPit + "\"]")
							  , restingPitTotal = Number(restingPit.data("pit-seeds"));
							$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalPit + "\"]").addClass("active");
							if (finalPit >= 0 && finalPit <= 7) {
								var capturedPit = $(".side-" + opponent.boardSide + " .pit[data-position=\"" + capturePosition + "\"]")
								  , totalCaptured = Number(capturedPit.data("pit-seeds"));
								if (restingPitTotal > 1 && totalCaptured > 0 && !currentPlayer.takataMode) {
									if (capturePosition === 3)
										opponent.stripHousePowers();
									game.calculatedSteps = totalCaptured;
									capturedPit.html("");
									capturedPit.data("pit-seeds", "0");
									opponent.currentPits[capturePosition] = 0;
									$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalSowPit + "\"]").addClass("active");
									if (direction === "right" && finalPit > 1 || direction === "left" && finalPit > 5) {
										departingPoint = -8;
										direction = "right";
									} else {
										departingPoint = -1;
										direction = "left";
									}
									if (game.breakRelay) {
										game.relayComplete();
									} else {

										game.relaySeeds(direction, departingPoint);
									}
								} else if (restingPitTotal > 1 && totalCaptured === 0 && finalSowPit === 3 && currentPlayer.namuaPhase && !currentPlayer.takataMode) {
									game.calculatedSteps = restingPitTotal;
									if (currentPlayer.houseStrippedPowers) {
										if (game.breakRelay) {
											game.relayComplete();
										} else {
											$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalSowPit + "\"]").addClass("active");
											game.relayAfterSeedInsert(finalSowPit, game.calculatedSteps, direction);
										}
									} else {
										if (currentPlayer.isAI()) {
											if (currentPlayer.houseResting) {
												game.relayComplete();
											} else {
												currentPlayer.stripHousePowers();
												if (game.breakRelay) {
													game.relayComplete();
												} else {
													game.relayAfterSeedInsert(finalSowPit, game.calculatedSteps, direction);
												}
											}
										} else {
											//console.log("Ask a player to proceed or rest");
											var title = "Would you like to proceed?"
											  , body = "Proceeding will strip your house of its powers."
											  , footer = "<div data-direction=\"" + direction + "\" data-moveSteps=\"" + game.calculatedSteps + "\" data-final-pit=\"" + finalSowPit + "\" class=\"btn btn-success accept-proceed w-100 mr-10\">Yes</div><div class=\"btn btn-danger deny-proceed w-100\">No</div>";
											Dialog(title, body, footer, false, true).open();
										}
									}
								} else if (restingPitTotal > 1 && totalCaptured === 0 || restingPitTotal > 1 && totalCaptured > 0 && currentPlayer.takataMode) {
									if (finalSowPit === 3 && !currentPlayer.houseStrippedPowers && currentPlayer.namuaPhase) {
										game.relayComplete();
									} else {
										//Do not capture, move along lad
										if (game.breakRelay) {
											game.relayComplete();
										} else {
											$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalSowPit + "\"]").addClass("active");
											game.calculatedSteps = restingPitTotal;
											game.relayAfterSeedInsert(finalSowPit, game.calculatedSteps, direction);
										}

									}
								} else if (restingPitTotal === 1 && totalCaptured === 0 || restingPitTotal === 1 && totalCaptured > 0) {
									game.relayComplete();
								}
							} else {
								//Movement for back row pits 
								if (restingPitTotal === 1) {
									game.relayComplete();
								} else {
									if (game.breakRelay) {
										game.relayComplete();
									} else {
										$(".side-" + currentPlayer.boardSide + " .pit[data-position=\"" + finalPit + "\"]").addClass("active");
										game.calculatedSteps = restingPitTotal;
										game.relayAfterSeedInsert(finalSowPit, game.calculatedSteps, direction);
									}

								}
							}
						}
					}, (game.settings.animation * i));
				}
				)(i, game, totalSteps, direction, departingPoint, properSowPit, $, currentPlayer, finalSowPit, opponent, Dialog);
			}
		}
	};
	var instantiate = function(type, level) {
		return new Game(type,level);
	};
	return instantiate;
}
)();

var Player = (function() {
	function Player(name, boardSide, lifeForm) {
		this.name = name;
		this.turn = false;
		this.currentPits = [];
		this.lifeForm = lifeForm;
		this.boardSide = boardSide;
		this.mtagiPhase = false;
		this.namuaPhase = false;
		this.takataMode = false;
		this.taxMode = false;
		this.relayMode = false;
		this.houseStrippedPowers = false;
		this.reserve = 20;
		this.collectingSeeds = false;
		this.freeSowingSeeds = false;
		this.houseResting = undefined;
	}
	Player.prototype = {
		constructor: Player,
		isAI: function() {
			return this.lifeForm === "ai" ? true : false;
		},
		isHuman: function() {
			return !this.isAI() ? true : false;
		},
		stripHousePowers: function() {
			this.houseStrippedPowers = true;
			return this;
		},
		initialMove: function() {
			return this.reserve === 20 ? true : false;
		},
		setPhase: function() {
			if (this.reserve > 0) {
				this.namuaPhase = true;
				this.mtagiPhase = false;
			} else {
				this.namuaPhase = false;
				this.mtagiPhase = true;
				this.stripHousePowers();
			}
			return this;
		},
		setState: function(state) {
			for (var property in state) {
				this[property] = state[property];
			}
			this.setPhase();
		},
		decreaseReserve: function(simulation) {
			if (simulation === void 0)
				simulation = false;
			if (this.namuaPhase) {
				this.reserve--;
				if (!simulation) {
					var side = $(".side-" + this.boardSide + " .seeds-reserve");
					if (this.reserve !== 0) {
						this.insertSeeds(0, this.reserve, true);
					} else {
						side.html("");
					}
				}
			}
			return this;
		},
		takataMove: function() {
			this.takataMode = true;
			return this;
		},
		captureMove: function() {
			this.takataMode = false;
			return this;
		},
		taxOn: function() {
			this.taxMode = true;
			return this;
		},
		taxOff: function() {
			this.taxMode = false;
			return this;
		},
		relayOn: function() {
			this.relayMode = true;
			return this;
		},
		relayOff: function() {
			this.relayMode = false;
			return this;
		},
		insertSeeds: function(targetPit, totalSeeds, isReserve) {
			var pit, min, max, minimiser;
			if (isReserve) {
				pit = $(".side-" + this.boardSide + " .seeds-reserve");
				max = pit.height() - 20;
				min = pit.width() - 20;
				pit.html("");
			} else {
				pit = $(".side-" + this.boardSide + " .pit[data-position=\"" + targetPit + "\"]");
				pit.data("pit-seeds", totalSeeds);
				minimiser = 2;
				max = Math.sqrt(Math.pow(pit.width(), 2) / minimiser);
				min = (pit.width()) / minimiser;
				pit.html("");
			}
			for (var i = 1; i <= totalSeeds; i++) {
				pit.append("<img style=\"left: " + getRandom(i, min) + "px; top:" + getRandom(i, max) + "px;\" class=\"seed\" src=" + icons.seed + ">");
				if (i == totalSeeds) {
					pit.append("<div class=\"pit-counter\">" + i + "</div>");
				}
			}
			return this;
		},
		lost: function() {
			var movablePits = 0
			  , innerSum = 0;
			for (var i = 0; i < 16; i++) {
				innerSum += i < 8 ? this.currentPits[i] : 0;
				movablePits += this.currentPits[i] > 1 ? 1 : 0;
			}
			return innerSum === 0 || movablePits === 0 && this.mtagiPhase ? true : false;
		},
		validMoves: function(opponent) {
			return this.lost() ? [] : this.playMode(opponent).playerMoves;
		},
		playMode: function(opponent) {
			this.setPhase();
			var player = this, mode, validMoves = {
				right: [],
				left: []
			}, takataPits = [], capturePits = [];
			if (player.namuaPhase) {
				if (player.initialMove()) {
					mode = "freeSowingSeeds";
					player.freeSowingSeeds = true;
					validMoves.right = validMoves.left = [1, 2];
				} else {
					for (var i = 0; i < 8; i++) {
						var playerPitTotal = player.currentPits[i]
						  , opponentPit = opponent.currentPits[7 - i];
						if (playerPitTotal > 0 && opponentPit === 0) {
							takataPits.push(i);
						} else if (playerPitTotal > 0 && opponentPit > 0) {
							capturePits.push(i);
						}
						if (i === 7) {
							if (capturePits.length > 0) {
								mode = "capture";
								player.takataMode = false;
								player.taxOff();
								for (var j = 0; j < capturePits.length; j++) {
									var pit = capturePits[j];
									if (pit < 2) {
										validMoves.left.push(pit);
									} else if (pit >= 6) {
										validMoves.right.push(pit);
									} else {
										validMoves.right.push(pit);
										validMoves.left.push(pit);
									}
								}
							} else if (takataPits.length > 0) {
								mode = "takata";
								player.takataMode = true;
								if (takataPits.length === 1) {
									if (takataPits[0] === 3) {
										if (player.currentPits[takataPits[0]] > 8 && !player.houseStrippedPowers) {
											player.taxOn();
										} else {
											player.houseStrippedPowers = true;
										}
										validMoves.right.push(takataPits[0]);
										validMoves.left.push(takataPits[0]);
									} else if (takataPits[0] === 0) {
										validMoves.left.push(takataPits[0]);
									} else if (takataPits[0] === 7) {
										validMoves.right.push(takataPits[0]);
									} else {
										validMoves.right = validMoves.left = takataPits;
									}
								} else {
									var singles = []
									  , many = [];
									for (var k = 0; k < takataPits.length; k++) {
										if (takataPits[k] === 3 && player.houseStrippedPowers || takataPits[k] !== 3) {
											if (player.currentPits[takataPits[k]] > 1) {
												many.push(takataPits[k]);
											} else {
												singles.push(takataPits[k]);
											}
										}
									}
									var selectedMoves = many.length > 0 ? many : singles;
									for (var l = 0; l < selectedMoves.length; l++) {
										validMoves.right.push(selectedMoves[l]);
										validMoves.left.push(selectedMoves[l]);
									}
								}
							}
						}
					}
				}
			} else if (player.mtagiPhase) {
				var directions = ["left", "right"]
				  , singleFillers = [];
				directions.forEach(function(direction) {
					var validPits = [];
					for (var i = 0; i < 16; i++) {
						var playerPitTotal = player.currentPits[i];
						if (playerPitTotal === 1) {
							if (i < 8)
								singleFillers.push(i);
						} else if (playerPitTotal > 1) {
							validPits.push(i);
						}
						if (i === 16 - 1) {
							for (var j = 0; j < validPits.length; j++) {
								var startPit = validPits[j]
								  , startPitTotal = player.currentPits[startPit]
								  , finalSowPit = properSowPit(startPitTotal, startPit, direction);
								if (startPitTotal < 16) {
									if (finalSowPit >= 0 && finalSowPit <= 7) {
										if (player.currentPits[finalSowPit] === 0 || player.currentPits[finalSowPit] > 0 && opponent.currentPits[7 - finalSowPit] === 0) {
											takataPits.push([direction, startPit]);
										} else if (player.currentPits[finalSowPit] > 0 && opponent.currentPits[7 - finalSowPit] > 0) {
											capturePits.push([direction, startPit]);
										}
									} else {
										takataPits.push([direction, startPit]);
									}
								} else {
									takataPits.push([direction, startPit]);
								}
							}
						}
					}
				});
				if (capturePits.length > 0) {
					mode = "capture";
					player.takataMode = false;
					capturePits.forEach(function(capturePit) {
						var captureDirection = capturePit[0]
						  , pit = capturePit[1];
						if (captureDirection == "left") {
							validMoves.left.push(pit);
						} else if (captureDirection == "right") {
							validMoves.right.push(pit);
						}
					});
				} else if (takataPits.length > 0) {
					mode = "takata";
					player.takataMode = true;
					var innerPits = []
					  , outerPits = [];
					takataPits.forEach(function(takataPit) {
						if (takataPit[1] > 7) {
							if (!inArray(takataPit[1], outerPits)) {
								outerPits.push(takataPit[1]);
							}
						} else {
							if (!inArray(takataPit[1], innerPits)) {
								innerPits.push(takataPit[1]);
							}
						}
					});
					if (innerPits.length > 0) {
						if (innerPits.length === 1) {
							if (innerPits[0] === 0 && singleFillers.length === 0) {
								validMoves.left.push(0);
							} else if (innerPits[0] === 7 && singleFillers.length === 0) {
								validMoves.right.push(7);
							} else {
								validMoves.left.push(innerPits[0]);
								validMoves.right.push(innerPits[0]);
							}
						} else {
							innerPits.forEach(function(innerPit) {
								validMoves.left.push(innerPit);
								validMoves.right.push(innerPit);
							});
						}
					} else if (outerPits.length > 0) {
						outerPits.forEach(function(outerPit) {
							validMoves.left.push(outerPit);
							validMoves.right.push(outerPit);
						});
					}
				}
			}
			var moves = [];
			for (var key in validMoves) {
				var pits = validMoves[key]
				  , direction = key;
				for (var n = 0; n < pits.length; n++) {
					var move = {
						direction: direction,
						pit: pits[n]
					};
					moves.push(move);
				}
			}
			if (player.namuaPhase && !player.takataMode && !player.houseStrippedPowers) {
				var newMoves = [];
				for (var o = 0; o < moves.length; o++) {
					var rest = deepCopy(moves[o]);
					rest.resting = true;
					var proceed = deepCopy(moves[o]);
					proceed.resting = false;
					newMoves.push(rest, proceed);
				}
				moves = allowed(3, null, moves) ? houseSafe(player, opponent, newMoves) : newMoves;
			}
			return {
				playerMode: mode,
				playerMoves: moves
			};
		}
	};
	var instantiate = function(name, boardSide, lifeForm) {
		return new Player(name,boardSide,lifeForm);
	};
	return instantiate;
}
)();

var moveSeeds = (function() {
	function moveSeeds(player, opponent, direction, startPoint, houseResting) {
		this.player = player;
		this.opponent = opponent;
		this.playerOrig = JSON.parse(JSON.stringify(player));
		this.opponentOrig = JSON.parse(JSON.stringify(opponent));
		this.totalSteps = 0;
		this.capturedSeeds = 0;
		this.playerBoard = this.player.currentPits;
		this.opponentBoard = this.opponent.currentPits;
		this.player.turn = true;
		this.opponent.turn = false;
		this.counter = 0;
		this.handler(direction, startPoint, houseResting);
	}
	moveSeeds.prototype = {
		constructor: moveSeeds,
		handler: function(direction, startPoint, houseResting) {
			var targetTotal = this.playerBoard[startPoint];
			if (this.player.namuaPhase && this.player.taxMode) {
				this.totalSteps = 2;
				targetTotal += 1;
				this.playerBoard[startPoint] = targetTotal;
				this.taxSeeds(direction);
			} else {
				if (this.player.namuaPhase && !this.player.takataMode) {
					var checkPit = 7 - startPoint
					  , opponentPitTotal = this.opponentBoard[checkPit];
					if (checkPit === 3) {
						this.opponent.stripHousePowers();
					}
					this.capturedSeeds += opponentPitTotal;
					this.opponentBoard.splice(checkPit, 1, 0);
					this.playerBoard.splice(startPoint, 1, targetTotal + 1);
					if (direction == "left") {
						startPoint = -1;
					} else if (direction == "right") {
						startPoint = -8;
					}
					this.totalSteps = this.capturedSeeds;
					if (this.player.namuaPhase) {
						this.player.relayOn();
					}
				} else if (this.player.namuaPhase && this.player.takataMode) {
					targetTotal += 1;
					this.totalSteps = targetTotal;
					this.playerBoard[startPoint] = targetTotal;
				} else if (this.player.mtagiPhase) {
					this.totalSteps = targetTotal;
				}
				try {
					this.makeMove(direction, startPoint, houseResting);
				} catch (e) {
					throw new Error(e);
				}
			}
			return {
				value: this.capturedSeeds,
				playerBoard: this.playerBoard,
				opponentBoard: this.opponentBoard,
				playerOrig: this.playerOrig,
				opponentOrig: this.opponentOrig
			};
		},
		taxSeeds: function(direction) {
			for (var i = 1; i <= this.totalSteps; i++) {
				var sowPit = direction === "right" ? 3 - i : 3 + i;
				this.player.currentPits[sowPit] = 1;
				if (i === this.totalSteps) {
					this.totalSteps = 0;
					this.player.currentPits[3] = this.player.currentPits[3] - 2;
					this.player.decreaseReserve(true).taxOff();
				}
			}
		},
		moveEnd: function() {
			this.player.decreaseReserve(true).relayOff();
		},
		makeMove: function(direction, departingPoint, houseResting) {
			this.counter += 1;
			var sowPit, finalSowPit;
			if (departingPoint > -1) {
				this.playerBoard[departingPoint] = 0;
			}
			for (var i = 1; i <= this.totalSteps; i++) {
				sowPit = properSowPit(i, departingPoint, direction);
				var sowPitTotal = this.playerBoard[sowPit] + 1;
				this.playerBoard[sowPit] = sowPitTotal;
				if (this.totalSteps === i) {
					this.totalSteps = 0;
					finalSowPit = sowPit;
					var capturePosition = 7 - sowPit
					  , restingPitTotal = this.playerBoard[finalSowPit];
					if (restingPitTotal > 1 && finalSowPit < 8) {
						if (this.player.takataMode) {
							if (this.player.namuaPhase && !this.player.houseStrippedPowers && finalSowPit === 3) {
								this.moveEnd();
								break;
							} else {
								this.totalSteps = restingPitTotal;
								if (this.counter > 2000) {
									this.moveEnd();
									break;
								} else {
									this.makeMove(direction, finalSowPit, houseResting);
								}
							}
						} else {
							var totalCaptured = this.opponentBoard[capturePosition];
							if (totalCaptured > 0) {
								this.totalSteps = totalCaptured;
								this.capturedSeeds += totalCaptured;
								this.opponentBoard[capturePosition] = 0;
								if (this.player.namuaPhase && capturePosition === 3)
									this.opponent.stripHousePowers();
								if (direction === "right" && finalSowPit > 1 || direction === "left" && finalSowPit > 5) {
									departingPoint = -8;
									direction = "right";
								} else {
									departingPoint = -1;
									direction = "left";
								}
								if (this.counter > 2000) {
									this.moveEnd();
									break;
								} else {
									this.makeMove(direction, departingPoint, houseResting);
								}
							} else {
								if (this.player.namuaPhase && this.player.houseStrippedPowers && finalSowPit === 3 || this.player.namuaPhase && !this.player.houseStrippedPowers && !houseResting && finalSowPit === 3 || this.player.namuaPhase && finalSowPit !== 3 || this.player.mtagiPhase) {
									if (this.player.namuaPhase && !this.player.houseResting && finalSowPit === 3) {
										this.player.stripHousePowers();
									}
									this.totalSteps = restingPitTotal;
									if (this.counter > 2000) {
										this.moveEnd();
										break;
									} else {
										this.makeMove(direction, finalSowPit, houseResting);
									}
								} else if (this.player.namuaPhase && !this.player.houseStrippedPowers && houseResting && finalSowPit === 3) {
									this.moveEnd();
									break;
								}
							}
						}
					} else if (restingPitTotal > 1 && finalSowPit > 7) {
						if (this.counter > 2000) {
							this.moveEnd();
							break;
						} else {
							this.totalSteps = restingPitTotal;
							this.makeMove(direction, finalSowPit, houseResting);
						}
					} else {
						this.moveEnd();
						break;
					}
				}
			}
		}
	};
	var instantiate = function(player, opponent, direction, startPoint, houseResting) {
		return new moveSeeds(player,opponent,direction,startPoint,houseResting);
	};
	return instantiate;
}
)();
var undoMoveSeeds = function(player, opponent, original) {
	player.setState(original.playerOrig);
	opponent.setState(original.opponentOrig);
};
var Dialog = (function() {
	function Dialog(title, body, footer, closeButton, minimiseButton) {
		this.title = title;
		this.body = body;
		this.footer = footer;
		this.closeButton = closeButton;
		this.minimiseButton = minimiseButton;
		if (arguments.length !== 0 && !$(".modal.open").found())
			this.create();
	}
	Dialog.prototype = {
		constructor: Dialog,
		create: function() {
			$(".modal-title").html(this.title);
			$(".modal-body").html(this.body);
			$(".modal-footer").html(this.footer);
			if ($(".modal-footer").html() === "") {
				$(".modal-footer").hide();
			} else {
				$(".modal-footer").show();
			}
			if (!this.closeButton) {
				$(".modal-dismiss-button").hide();
			} else {
				$(".modal-dismiss-button").show();
			}
			if(this.minimiseButton) {
				$(".minimise-modal").show();
			} else {
				$(".minimise-modal").hide();
			}
			return this;
		},
		open: function() {
			if ($(".modal.open").found()) {
				var _this = this;
				this.create().close();
				setTimeout(function() {
					_this.open();
				}, 300);
			} else {
				$(".modal").addClass("open");
			}
			return this;
		},
		close: function() {
			$(".modal").addClass("close");
			setTimeout(function() {
				$(".modal").removeClass("open close");
			}, 300);
			return this;
		}
	};
	var instantiate = function(title, body, footer, closeButton, minimiseButton) {
		return new Dialog(title,body,footer,closeButton, minimiseButton);
	};
	return instantiate;
}
)();
/**
* Miscellaneous
*/
var bawoGame, screenHeight = $("body").outerHeight(), screenWidth = $("body").outerWidth(), icons = {
	seed: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayINCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCINCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIg0KICAgd2lkdGg9Ijg3Ig0KICAgaGVpZ2h0PSI4NS4zNjIiDQogICBpZD0ic3ZnMiINCiAgIHNvZGlwb2RpOnZlcnNpb249IjAuMzIiDQogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkyLjMgKDI0MDU1NDYsIDIwMTgtMDMtMTEpIg0KICAgdmVyc2lvbj0iMS4wIg0KICAgc29kaXBvZGk6ZG9jbmFtZT0ic2VlZC5zdmciPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczQiPg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM5NjAiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM5NjIiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzk2NCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMwNTciPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMwNTkiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzAwMDAwMDtzdG9wLW9wYWNpdHk6MC4zMzU3NjYiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDMwNjEiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8cmFkaWFsR3JhZGllbnQNCiAgICAgICBpbmtzY2FwZTpjb2xsZWN0PSJhbHdheXMiDQogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50MzA1NyINCiAgICAgICBpZD0icmFkaWFsR3JhZGllbnQyMzg3Ig0KICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIg0KICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMS4xNzMwMiwwLjMzMjU4MywtMC4yOTkzNzIsMS4wNTU5MSwxMDAuMTkxLC0xMTMuMjE5KSINCiAgICAgICBjeD0iMjU5Ig0KICAgICAgIGN5PSI0ODQuMzYyIg0KICAgICAgIGZ4PSIyNTkiDQogICAgICAgZnk9IjQ4NC4zNjIiDQogICAgICAgcj0iNDEiIC8+DQogICAgPHJhZGlhbEdyYWRpZW50DQogICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIg0KICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXJHcmFkaWVudDM5NjAiDQogICAgICAgaWQ9InJhZGlhbEdyYWRpZW50MjM4OSINCiAgICAgICBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSINCiAgICAgICBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC0wLjE2MjQwNSwwLjk5Mzc2MiwtMS4wMDYwOCwtMC4wNDQ5MjcsNzk1LjIyNSwyNTAuNDQ2KSINCiAgICAgICBjeD0iMjU5Ljg1MiINCiAgICAgICBjeT0iNDg1LjU3MSINCiAgICAgICBmeD0iMjU5Ljg1MiINCiAgICAgICBmeT0iNDg1LjU3MSINCiAgICAgICByPSIxMy41IiAvPg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyINCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyR3JhZGllbnQzOTYwIg0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDI0MjMiDQogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiDQogICAgICAgeDE9Ii0xMSINCiAgICAgICB5MT0iLTI2Ig0KICAgICAgIHgyPSItMTEiDQogICAgICAgeTI9IjEuNDIxMDllLTAxNCIgLz4NCiAgICA8cmFkaWFsR3JhZGllbnQNCiAgICAgICBpbmtzY2FwZTpjb2xsZWN0PSJhbHdheXMiDQogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50MzA1NyINCiAgICAgICBpZD0icmFkaWFsR3JhZGllbnQyNjU5Ig0KICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIg0KICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMS4xNzMwMiwwLjMzMjU4MywtMC4yOTkzNzIsMS4wNTU5MSwxMDAuMTkxLC0xMTMuMjE5KSINCiAgICAgICBjeD0iMjU5Ig0KICAgICAgIGN5PSI0ODQuMzYyIg0KICAgICAgIGZ4PSIyNTkiDQogICAgICAgZnk9IjQ4NC4zNjIiDQogICAgICAgcj0iNDEiIC8+DQogICAgPHJhZGlhbEdyYWRpZW50DQogICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIg0KICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXJHcmFkaWVudDM5NjAiDQogICAgICAgaWQ9InJhZGlhbEdyYWRpZW50MjY2MSINCiAgICAgICBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSINCiAgICAgICBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC0wLjE2MjQwNSwwLjk5Mzc2MiwtMS4wMDYwOCwtMC4wNDQ5MjcsNzk1LjIyNSwyNTAuNDQ2KSINCiAgICAgICBjeD0iMjU5Ljg1MiINCiAgICAgICBjeT0iNDg1LjU3MSINCiAgICAgICBmeD0iMjU5Ljg1MiINCiAgICAgICBmeT0iNDg1LjU3MSINCiAgICAgICByPSIxMy41IiAvPg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyINCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyR3JhZGllbnQzOTYwIg0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDI2NjMiDQogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiDQogICAgICAgeDE9Ii0xMSINCiAgICAgICB5MT0iLTI2Ig0KICAgICAgIHgyPSItMTEiDQogICAgICAgeTI9IjEuNDIxMDllLTAxNCIgLz4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzMDU3LTgiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMwNTktMyIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzA2MS04IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50Mzk2MC03Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzOTYyLTEiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzk2NC0wIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzMwNyI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzMwOSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzMzExIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzMxNCI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzMxNiIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzMxOCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzMjEiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMzMjMiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzMyNSIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzMjgiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMzMzAiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzMzMiIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzMzUiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMzMzciIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzAwMDAwMDtzdG9wLW9wYWNpdHk6MC4zMzU3NjYiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDMzMzkiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzMzQyIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzMzQ0IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDMzNDYiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzMzQ5Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzMzUxIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDMzNTMiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzMzU2Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzMzU4IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDAwMDA7c3RvcC1vcGFjaXR5OjAuMzM1NzY2Ig0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzMzYwIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzM2MyI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzM2NSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzMzY3IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzM3MCI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzM3MiIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzMzc0IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzM3NyI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzM3OSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzM4MSIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzODQiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMzODYiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzM4OCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzOTEiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMzOTMiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzM5NSIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMzOTgiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM0MDAiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzAwMDAwMDtzdG9wLW9wYWNpdHk6MC4zMzU3NjYiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM0MDIiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzNDA1Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzNDA3IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM0MDkiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzNDEyIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzNDE0IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM0MTYiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzNDE5Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzNDIxIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDAwMDA7c3RvcC1vcGFjaXR5OjAuMzM1NzY2Ig0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzNDIzIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzQyNiI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzQyOCIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzNDMwIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzQzMyI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzQzNSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzNDM3IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzQ0MCI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzQ0MiIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzQ0NCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM0NDciPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM0NDkiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzQ1MSIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM0NTQiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM0NTYiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzQ1OCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM0NjEiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM0NjMiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzAwMDAwMDtzdG9wLW9wYWNpdHk6MC4zMzU3NjYiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM0NjUiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzNDY4Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzNDcwIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM0NzIiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpbmtzY2FwZTpjb2xsZWN0PSJhbHdheXMiDQogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50Mzk2MC03Ig0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDI2NjMtNyINCiAgICAgICBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSINCiAgICAgICB4MT0iLTExIg0KICAgICAgIHkxPSItMjYiDQogICAgICAgeDI9Ii0xMSINCiAgICAgICB5Mj0iMS40MjEwOWUtMDE0IiAvPg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM0NzUiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM0NzciIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzQ3OSIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMwNTctOC0zIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzMDU5LTMtNyIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzA2MS04LTIiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzOTYwLTctNyI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzk2Mi0xLTUiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzk2NC0wLTMiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpbmtzY2FwZTpjb2xsZWN0PSJhbHdheXMiDQogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50Mzk2MC03LTciDQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MjUwOS0xLTQiDQogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiDQogICAgICAgeDE9Ii0xMSINCiAgICAgICB5MT0iLTI2Ig0KICAgICAgIHgyPSItMTEiDQogICAgICAgeTI9IjEuNDIxMDllLTAxNCIgLz4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzOTQ0Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzOTQ2IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDM5NDgiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzMDU3LTgtMzQiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDMwNTktMy0wIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDAwMDA7c3RvcC1vcGFjaXR5OjAuMzM1NzY2Ig0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzMDYxLTgtMCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM5NjAtNy0zIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzOTYyLTEtMSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3AzOTY0LTAtMCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDQwMjMiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDQwMjUiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wNDAyNyIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDQwMzAiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDQwMzIiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzAwMDAwMDtzdG9wLW9wYWNpdHk6MC4zMzU3NjYiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDQwMzQiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQ0MDM3Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3A0MDM5IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDQwNDEiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQ0MDQ0Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3A0MDQ2IiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDQwNDgiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQ0MDUxIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3A0MDUzIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDAwMDA7c3RvcC1vcGFjaXR5OjAuMzM1NzY2Ig0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3A0MDU1IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50NDA1OCI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wNDA2MCIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3A0MDYyIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIg0KICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXJHcmFkaWVudDM5NjAtNy0zIg0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDI1MjktOS01Ig0KICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIg0KICAgICAgIHgxPSItMTEiDQogICAgICAgeTE9Ii0yNiINCiAgICAgICB4Mj0iLTExIg0KICAgICAgIHkyPSIxLjQyMTA5ZS0wMTQiIC8+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50NDA2NSI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wNDA2NyIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3A0MDY5IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzA1Ny04LTMtOCI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzA1OS0zLTctMyIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzA2MS04LTItMCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDM5NjAtNy03LTIiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDM5NjItMS01LTMiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzk2NC0wLTMtNiIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDQyMzQiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDQyMzYiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wNDIzOCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDMwNTctOC01Ij4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3AzMDU5LTMtNSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzA2MS04LTQiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQzOTYwLTctMiI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wMzk2Mi0xLTYiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wMzk2NC0wLTA2IiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50NDI0OSI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MSINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wNDI1MSIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIg0KICAgICAgICAgb2Zmc2V0PSIxIg0KICAgICAgICAgaWQ9InN0b3A0MjUzIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50NDI1NiI+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMCINCiAgICAgICAgIGlkPSJzdG9wNDI1OCIgLz4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojMDAwMDAwO3N0b3Atb3BhY2l0eTowLjMzNTc2NiINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wNDI2MCIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDQyNjMiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjEiDQogICAgICAgICBvZmZzZXQ9IjAiDQogICAgICAgICBpZD0ic3RvcDQyNjUiIC8+DQogICAgICA8c3RvcA0KICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZjtzdG9wLW9wYWNpdHk6MCINCiAgICAgICAgIG9mZnNldD0iMSINCiAgICAgICAgIGlkPSJzdG9wNDI2NyIgLz4NCiAgICA8L2xpbmVhckdyYWRpZW50Pg0KICAgIDxsaW5lYXJHcmFkaWVudA0KICAgICAgIHkyPSIxLjQyMTA5ZS0wMTQiDQogICAgICAgeDI9Ii0xMSINCiAgICAgICB5MT0iLTI2Ig0KICAgICAgIHgxPSItMTEiDQogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiDQogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MzU1NC03Ig0KICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXJHcmFkaWVudDM5NjAtNy0yIg0KICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyIgLz4NCiAgICA8bGluZWFyR3JhZGllbnQNCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQ0MjcwIj4NCiAgICAgIDxzdG9wDQogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eToxIg0KICAgICAgICAgb2Zmc2V0PSIwIg0KICAgICAgICAgaWQ9InN0b3A0MjcyIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmZmZmY7c3RvcC1vcGFjaXR5OjAiDQogICAgICAgICBvZmZzZXQ9IjEiDQogICAgICAgICBpZD0ic3RvcDQyNzQiIC8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgPC9kZWZzPg0KICA8c29kaXBvZGk6bmFtZWR2aWV3DQogICAgIGlkPSJiYXNlIg0KICAgICBwYWdlY29sb3I9IiNmZmZmZmYiDQogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2Ig0KICAgICBib3JkZXJvcGFjaXR5PSIxLjAiDQogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiDQogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiDQogICAgIGlua3NjYXBlOnpvb209IjAuMzI1MjY5MTIiDQogICAgIGlua3NjYXBlOmN4PSItMTUwOS45Mjc2Ig0KICAgICBpbmtzY2FwZTpjeT0iMTI1LjE3MzExIg0KICAgICBpbmtzY2FwZTpkb2N1bWVudC11bml0cz0icHgiDQogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSINCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIg0KICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDA1Ig0KICAgICBpbmtzY2FwZTp3aW5kb3cteD0iMTkxMSINCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii05Ig0KICAgICBzaG93Z3JpZD0iZmFsc2UiDQogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiIC8+DQogIDxtZXRhZGF0YQ0KICAgICBpZD0ibWV0YWRhdGE3Ij4NCiAgICA8cmRmOlJERj4NCiAgICAgIDxjYzpXb3JrDQogICAgICAgICByZGY6YWJvdXQ9IiI+DQogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0Pg0KICAgICAgICA8ZGM6dHlwZQ0KICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPg0KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4NCiAgICAgIDwvY2M6V29yaz4NCiAgICA8L3JkZjpSREY+DQogIDwvbWV0YWRhdGE+DQogIDxnDQogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIg0KICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIg0KICAgICBpZD0ibGF5ZXIxIg0KICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNi41LC01Ljk1NykiPg0KICAgIDxnDQogICAgICAgaWQ9ImcxNTA0Ig0KICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLC02KSI+DQogICAgICA8Y2lyY2xlDQogICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTk4LjUsLTQ0NC4wNDMpIg0KICAgICAgICAgaWQ9InBhdGgxMzUyIg0KICAgICAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MC4zNzg0ODY7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjE7c3Ryb2tlLWxpbmVqb2luOmJldmVsO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1kYXNob2Zmc2V0OjA7c3Ryb2tlLW9wYWNpdHk6MSINCiAgICAgICAgIGN4PSIyNTQiDQogICAgICAgICBjeT0iNTAwLjM2MiINCiAgICAgICAgIHI9IjQxIiAvPg0KICAgICAgPGNpcmNsZQ0KICAgICAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MC4zNzg0ODY7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjE7c3Ryb2tlLWxpbmVqb2luOmJldmVsO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1kYXNob2Zmc2V0OjA7c3Ryb2tlLW9wYWNpdHk6MSINCiAgICAgICAgIGlkPSJwYXRoNDg0MyINCiAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMDEuNSwtNDQ2LjA0MykiDQogICAgICAgICBjeD0iMjU0Ig0KICAgICAgICAgY3k9IjUwMC4zNjIiDQogICAgICAgICByPSI0MSIgLz4NCiAgICAgIDxjaXJjbGUNCiAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMDMuNSwtNDQ3LjQwNSkiDQogICAgICAgICBpZD0icGF0aDEzMDciDQogICAgICAgICBzdHlsZT0iZmlsbDpncmF5O2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxO3N0cm9rZS1saW5lam9pbjpiZXZlbDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2UtZGFzaG9mZnNldDowO3N0cm9rZS1vcGFjaXR5OjEiDQogICAgICAgICBjeD0iMjU0Ig0KICAgICAgICAgY3k9IjUwMC4zNjIiDQogICAgICAgICByPSI0MSIgLz4NCiAgICAgIDxjaXJjbGUNCiAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMDMuNSwtNDQ3LjQwNSkiDQogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI3JhZGlhbEdyYWRpZW50MjY1OSk7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjE7c3Ryb2tlLWxpbmVqb2luOmJldmVsO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1kYXNob2Zmc2V0OjA7c3Ryb2tlLW9wYWNpdHk6MSINCiAgICAgICAgIGlkPSJwYXRoMjE4MiINCiAgICAgICAgIGN4PSIyNTQiDQogICAgICAgICBjeT0iNTAwLjM2MiINCiAgICAgICAgIHI9IjQxIiAvPg0KICAgICAgPGNpcmNsZQ0KICAgICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoLTAuMDQyNTY5LC0xLjEzMjk5LDEuOTgyMzEsLTAuMDg5MDQzLC05MDIuMTIsNDI0LjQ5MSkiDQogICAgICAgICBpZD0icGF0aDM5NTgiDQogICAgICAgICBzdHlsZT0ib3BhY2l0eTowLjU7ZmlsbDp1cmwoI3JhZGlhbEdyYWRpZW50MjY2MSk7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjE7c3Ryb2tlLWxpbmVqb2luOmJldmVsO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1kYXNob2Zmc2V0OjA7c3Ryb2tlLW9wYWNpdHk6MSINCiAgICAgICAgIGN4PSIyNjQuNSINCiAgICAgICAgIGN5PSI0ODYuODYyIg0KICAgICAgICAgcj0iMTMuNSIgLz4NCiAgICAgIDxlbGxpcHNlDQogICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgxLjE0ODE1LDAsMCwxLjUsNjMuMTI5Niw1My45NTY3KSINCiAgICAgICAgIGlkPSJwYXRoMTQwMiINCiAgICAgICAgIHN0eWxlPSJvcGFjaXR5OjAuODExMDI0O2ZpbGw6dXJsKCNsaW5lYXJHcmFkaWVudDI2NjMpO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxO3N0cm9rZS1saW5lam9pbjpiZXZlbDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2UtZGFzaG9mZnNldDowO3N0cm9rZS1vcGFjaXR5OjEiDQogICAgICAgICBjeD0iLTExIg0KICAgICAgICAgY3k9Ii0xMyINCiAgICAgICAgIHJ4PSIyNyINCiAgICAgICAgIHJ5PSIxMyIgLz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K",
	laptop: "<svg height=\"28\" width=\"28\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fill-rule=\"evenodd\"><path d=\"M0 0h28v28H0z\"></path><path d=\"M6.56 6h14.88c.89 0 1.21.1 1.54.27.32.17.58.43.75.75s.27.65.27 1.54V21H4V8.56c0-.89.1-1.21.27-1.54.17-.32.43-.58.75-.75S5.67 6 6.56 6z\" stroke=\"currentColor\" stroke-width=\"2\"></path><path d=\"M1 20h26a1 1 0 011 1c0 .6-.38 1.13-.95 1.32l-.7.23c-.5.17-.76.25-1 .3a4.16 4.16 0 01-.72.13c-.26.02-.52.02-1.06.02H4.43c-.54 0-.8 0-1.06-.02a4.16 4.16 0 01-.71-.12 13.64 13.64 0 01-1.01-.31l-.7-.23A1.39 1.39 0 010 21a1 1 0 011-1z\" fill=\"currentColor\" class=\"desktop_outline_28-1\"></path></g></svg>",
	activeAvatar: "<svg width=\"28\" height=\"28\" viewBox=\"0 0 16 16\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"id-user_16__Page-2\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g id=\"id-user_16__user_16\"><path id=\"id-user_16__Bounds\" d=\"M0 0h16v16H0z\"></path><path d=\"M10.75 5.25a2.75 2.75 0 10-5.5 0 2.75 2.75 0 005.5 0zM2.5 12.12v.71c0 .37.3.67.67.67h9.66c.37 0 .67-.3.67-.67v-.71C13.5 9.69 9.84 9 8 9c-1.84 0-5.5.7-5.5 3.12z\" id=\"id-user_16__Mask\" fill=\"currentColor\"></path></g></g></svg>",
	avatar: "<svg width=\"28\" height=\"28\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fill-rule=\"evenodd\"><path d=\"M0 0h28v28H0z\"></path><path d=\"M17.5 8.5A3.5 3.5 0 0014 5a3.5 3.5 0 00-3.5 3.5 3.5 3.5 0 107 0zm2 0A5.5 5.5 0 0114 14a5.5 5.5 0 01-5.5-5.5 5.5 5.5 0 1111 0zM7 20.64c0 .95-.08.86.46.86h13.58c.54 0 .46.09.46-.86 0-2.28-3.3-3.64-7.25-3.64S7 18.36 7 20.64zm-2 0C5 16.76 9.3 15 14.25 15s9.25 1.76 9.25 5.64c0 2.02-.78 2.86-2.46 2.86H7.46C5.78 23.5 5 22.66 5 20.64z\" fill=\"currentColor\" fill-rule=\"nonzero\"></path></g></svg>",
	closeIcon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><g><path d=\"M13.414 12l5.793-5.793c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0L12 10.586 6.207 4.793c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414L10.586 12l-5.793 5.793c-.39.39-.39 1.023 0 1.414.195.195.45.293.707.293s.512-.098.707-.293L12 13.414l5.793 5.793c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L13.414 12z\"></path></g></svg>"
};
$(".side-a-contender .player-status").html(icons.activeAvatar);
$(".side-b-contender .player-status").html(icons.avatar);
$(".player-avatar").html(icons.avatar);
$(".modal-dismiss-button").html(icons.closeIcon);

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}
var shuffle = function(array) {
	var shuffledArray = [];
	while (array.length > 0) {
		var i = Math.floor(Math.random() * array.length);
		shuffledArray.push(array[i]);
		array.splice(i, 1);
	}
	return shuffledArray;
}
var deepCopy = function(elements) {
	return JSON.parse(JSON.stringify(elements));
}

function arraySum(array) {
	var total = 0;
	for (var i = 0; i < array.length; i++) {
		total += array[i];
	}
	return total;
}
var arrayCount = function(array, item) {
	var count = 0;
	for (var i = 0; i < array.length; i++) {
		if (array[i] == item)
			count++;
	}
	return count;
}

var arrayMatch = function(first, last) {
	if (first.length !== last.length) {
		return false;
	}
	for (var i = 0; i < first.length; i++) {
		if (first[i] !== last[i]) {
			return false;
		}
	}
	return true;
}
var type = function(element) {
	var classCall = Object.prototype.toString.call(element).toLowerCase();
	return classCall.match(/\s+\w+/)[0].replace(/\s+/, "");
}
var arrayIncludes = function(array, searchElement, fromIndex=0) {
	for (var i = fromIndex; i < array.length; i++) {
		if (type(searchElement) === "array") {
			if (arrayMatch(array[i], searchElement)) {
				return [true, i];
			}
		} else {
			if (i == searchElement) {
				return [true, i];
			}
		}
	}
	return false;
}

function inArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (value === array[i]) {
			return true;
		}
	}
	return false;
}
var centerFooter = function(player, position) {
	var footer = $(".side-" + player.boardSide + ".footer");
	footer.get(0).style[position === "top" ? "bottom" : "top"] = null;
	var gap = ($(".board").offset().top - footer.outerHeight()) / 2;
	footer.css(position, (gap > 10 ? gap : 10) + "px");
}
var timeElapsed = function(start, finish) {
	var difference = new Date(finish).getTime() - new Date(start).getTime()
	  , seconds = Math.floor(difference / 1000)
	  , minutes = Math.floor(seconds / 60);
	return seconds >= 60 ? minutes + "m" : seconds + "s";
}

function properSowPit(index, startPit, direction) {
	var sowPit = direction === "right" ? startPit - index : startPit + index;
	while (direction === "right" && sowPit < 0 || direction === "left" && sowPit > 15) {
		sowPit = direction === "right" ? sowPit + 16 : sowPit - 16;
	}
	return sowPit;
}

function merge(first, second) {
	var i = first.length;
	for (var j = 0; j < second.length; j++) {
		first[i++] = second[j];
	}
	return first;
}
/**
 * Checks validity of specified pit and direction for movement
 * @param {number} pit
 * @param {string} direction
 * @param {array} moves
 * @returns
 */
function allowed(pit, direction, moves) {
	var pits = 0
	  , directions = 0
	  , combo = 0;
	for (var i = 0; i < moves.length; i++) {
		var moveDirection = moves[i].direction;
		var movePit = moves[i].pit;
		if (pit !== null && direction !== null) {
			if (movePit === pit && moveDirection === direction)
				combo += 1;
		} else {
			if (pit !== null && pit === movePit)
				pits += 1;
			if (direction !== null && direction === moveDirection)
				directions += 1;
		}
	}
	if (pit !== null && direction !== null) {
		return combo > 0 ? true : false;
	} else if (pit !== null) {
		return pits > 0 ? true : false;
	} else if (direction !== null) {
		return directions > 0 ? true : false;
	}
}

var evaluateState = function(player) {
	var players = JSON.parse(localStorage.getItem("bawoPlayInfo"));
	for (var i = 0; i < players.length; i++) {
		if (players[i].boardSide === player.boardSide) {
			return arraySum(player.currentPits) - arraySum(players[i].currentPits);
		}
	}
};

var win = function(player, opponent) {
	return player.lost() ? opponent : opponent.lost() ? player : null;
};
/**
 * Modified Negamax Algorithm with Alpha Beta Pruning
 * @param {object} player Player
 * @param {object} opponent Opponent
 * @param {number} depth Depth
 * @param {number} alpha Maximum evaluation
 * @param {number} beta Minimum evaluation
 * @param {boolean} maximisingPlayer Maximising Player
 * @returns {number | array}
 */
var bestMove = function(player, opponent, depth, alpha, beta, maximisingPlayer) {
	var root = depth
	  , complete = false;
	return (function negamax(player, opponent, depth, alpha, beta, maximisingPlayer) {
		var winner = win(player, opponent);
		if (winner) {
			return winner === player ? Infinity : -Infinity;
		} else if (depth === 0) {
			return maximisingPlayer ? evaluateState(player) : -evaluateState(opponent);
		}
		var value = -Infinity
		  , bestMoveValue = -Infinity
		  , bestMoveFound = null
		  , moves = player.validMoves(opponent);
		for (var i = 0; i < moves.length; i++) {
			var result = moveSeeds(player, opponent, moves[i].direction, moves[i].pit, moves[i].resting);
			value = Math.max(value, -negamax(opponent, player, depth - 1, -beta, -alpha, !maximisingPlayer));
			alpha = Math.max(alpha, value);
			if (depth === root) {
				bestMoveValue = Math.max(bestMoveValue, value);
				bestMoveFound = value >= bestMoveValue ? moves[i] : bestMoveFound;
				moves[i].value = maximisingPlayer ? value : -value;
				alpha = value = -Infinity;
				beta = Infinity;
				complete = i === moves.length - 1;
			}
			undoMoveSeeds(player, opponent, result);
			if (alpha >= beta) {
				break;
			}
		}
		return complete ? [bestMoveFound, moves] : value;
	})(player, opponent, depth, alpha, beta, maximisingPlayer);
};
/**
* Return moves from a pool of moves that protects the house in namuaPhase for being captured
* @param {object} player
* @param {object} opponent
* @param {array} possibleMoves
* @returns
*/
function houseSafe(player, opponent, moves) {
	var safeMoves = [];
	for (var i = 0; i < moves.length; i++) {
		var move = moves[i]
		  , result = moveSeeds(player, opponent, move.direction, move.pit, move.resting);
		if (opponent.currentPits[4] === 0) {
			safeMoves.push(moves[i]);
		}
		undoMoveSeeds(player, opponent, result);
	}
	return safeMoves;
}

/**
* Combinations
* @param {Array | number} set Original set of items
* @param {number} items Size of combination subsets 
* @param {boolean} repeat Repeat combination
* @return {Array} Array of combination arrays.
*/
var combinations = function(set, items, repeat) {
	if (items === void 0)
		items = set.length || set;
	if (repeat === void 0)
		repeat = true;
	var initialSet = [], multiSet = [], arraySet = [], subSet, i = 0, isArray = set.constructor.name === "Array", x = isArray ? set.length - 1 : set - 1, n = isArray ? set.length : set;
	while (initialSet.length < items) {
		initialSet.push(0);
	}
	while (i >= 0) {
		initialSet[items - 1] = i;
		if (i > x) {
			var last = initialSet.length - 1;
			while (true) {
				initialSet[last]++;
				if (initialSet[last] >= n) {
					last--;
				} else {
					break;
				}
			}
			for (var y = 0; y < initialSet.length; y++) {
				initialSet[y] = y >= last ? initialSet[last] : initialSet[y];
			}
			i = initialSet[items - 1];
		}
		var repetition = false;
		for (var q = 0; q < initialSet.length; q++) {
			if (initialSet[q] == initialSet[q + 1]) {
				repetition = true;
				break;
			}
		}
		if (isArray) {
			for (var z = 0; z < initialSet.length; z++) {
				arraySet[z] = set[initialSet[z]];
			}
		}
		subSet = isArray ? arraySet : initialSet;
		if (repeat || !repeat && !repetition) {
			multiSet.push(JSON.parse(JSON.stringify(subSet)));
		}
		i++;
		if (initialSet[0] == x)
			i = -1;
	}
	return multiSet;
};
var layouts = function() {
	var multiSet = combinations(16, 5)
	  , completeLayouts = [];
	for (var i = 0; i < multiSet.length; i++) {
		var position = []
		  , layout = [];
		for (var j = 0; j < 16; j++) {
			position.push([j, arrayCount(multiSet[i], j)]);
		}
		for (var k = 0; k < position.length; k++) {
			var totalSeeds = position[k][1];
			layout[position[k][0]] = k == 3 ? totalSeeds + 8 : totalSeeds;
		}
		completeLayouts.push(layout);
	}
	return completeLayouts;
}

var bestLayout = function(game, depth, layouts) {
	layouts = shuffle(layouts);
	var startTime = new Date()
	  , previousInstance = JSON.parse(JSON.stringify(game.currentPlayer))
	  , previousLayouts = JSON.parse(JSON.stringify(layouts))
	  , bestLayoutValue = -Infinity
	  , bestLayoutFound = null;
	for (var i = 0; i < layouts.length; i++) {
		game.currentPlayer.currentPits = previousLayouts[i];
		game.currentPlayer.decreaseReserve(true);
		var value = bestMove(game.opponent, game.currentPlayer, depth, -Infinity, Infinity, false)[0].value;
		game.currentPlayer.setState(previousInstance);
		if (value >= bestLayoutValue) {
			bestLayoutValue = value;
			bestLayoutFound = layouts[i];
		}
		/*
	 * Time limit in processing of shuffled layouts
	 * This is due to limited capabilities to process 15,504 layouts in short timespan
	 * If you're using a Super Computer comment out the  conditional statement below
	 */
		var time = timeElapsed(startTime, new Date());
		if (time === "30s") {
			console.log("Layouts: ", i + 1, "Best value: ", bestLayoutValue, "Time: ", time);
			break;
		}
	}
	return bestLayoutFound;
};
/**
*bestLayouts functions should only be run in a capable machine
*/
var bestLayouts = function(player, opponent, depth, layouts) {
	var sets = JSON.parse(JSON.stringify(layouts));
	var playerInstance = JSON.parse(JSON.stringify(player))
	  , opponentInstance = JSON.parse(JSON.stringify(opponent))
	  , bestValue = -Infinity
	  , bestLayout = null;
	for (var i = 0; i < layouts.length; i++) {
		console.log(i);
		for (var j = 0; j < layouts.length; j++) {
			player.currentPits = sets[i];
			player.decreaseReserve(true);
			opponent.currentPits = sets[j];
			opponent.decreaseReserve(true);
			var value = bestMove(player, opponent, depth, -Infinity, Infinity, false)[0].value;
			if (value >= bestValue) {
				bestValue = value;
				bestLayout = layouts[i];
			}
			player.setState(playerInstance);
			opponent.setState(opponentInstance);
			sets = JSON.parse(JSON.stringify(layouts));
		}
	}
	return [bestLayout, bestValue];
};
function initiateMove(game) {
	var depth, layoutsArray = game.possibleLayouts(), levels = {
		easy: 0,
		medium: 1,
		hard: 6
	};
	for (var level in levels) {
		if (game.level == level) {
			depth = levels[level];
			break;
		}
	}
	if (game.currentPlayer.namuaPhase && game.currentPlayer.initialMove()) {
		var counterLayout = depth === 0 || game.opponent.initialMove() ? layoutsArray[0][Math.floor(getRandom(0, layoutsArray[0].length - 1))] : bestLayout(game, depth, layoutsArray[1]);
		for (var i = 0; i < counterLayout.length; i++) {
			var layoutTarget = i
			  , layoutTotal = counterLayout[i];
			game.currentPlayer.insertSeeds(layoutTarget, layoutTotal, false);
			if (i === counterLayout.length - 1) {
				//this.playHistory.set(JSON.parse(localStorage.getItem("bawoPlayInfo"))).remove(true);
				game.currentPlayer.decreaseReserve();
				game.currentPlayer.insertSeeds(0, game.currentPlayer.reserve, true);
				game.currentPlayer.currentPits = counterLayout;
				game.currentPlayer.collectingSeeds = false;
				game.currentPlayer.freeSowingSeeds = false;
				game.switchPlayers();
				game.log.set(game.currentPlayer.name + " layout set", counterLayout);
			}
		}
	} else if (game.currentPlayer.namuaPhase || game.currentPlayer.mtagiPhase) {
		var direction, pit, resting;
		if (depth === 0) {
			var validMoves = bawoGame.currentPlayer.validMoves(bawoGame.opponent)
			  , randomMove = validMoves[Math.floor(getRandom(0, validMoves.length - 1))];
			direction = randomMove.direction;
			pit = randomMove.pit;
			resting = randomMove.resting;
		} else {
			var bestMoveInfo = bestMove(game.currentPlayer, game.opponent, depth, -Infinity, Infinity, true)[0];
			direction = bestMoveInfo.direction;
			pit = bestMoveInfo.pit;
			resting = bestMoveInfo.resting;
		}
		var totalSteps = 0
		  , targetTotal = Number($(".side-" + game.currentPlayer.boardSide + " .pit[data-position=\"" + pit + "\"]").data("pit-seeds"))
		  , departingPoint = pit;
		game.currentPlayer.houseResting = resting;
		var playablePit = $(".side-" + game.currentPlayer.boardSide + " .pit[data-position=\"" + pit + "\"]");

		playablePit.addClass("active");
		if (game.currentPlayer.namuaPhase) {
			targetTotal += 1;
			game.currentPlayer.insertSeeds(pit, targetTotal, false);
		} else {
			totalSteps = targetTotal;
		}
		setTimeout(function() {
			if (game.currentPlayer.taxMode) {
				game.taxSeeds(direction);
			} else {
				if (game.currentPlayer.namuaPhase) {
					if (game.currentPlayer.takataMode) {
						totalSteps = targetTotal;
						game.calculatedSteps = totalSteps;
					} else {
						var opponentPitTotal = Number($(".side-" + game.opponent.boardSide + " .pit[data-position=\"" + (7 - pit) + "\"]").data("pit-seeds"));
						totalSteps = opponentPitTotal;
						game.calculatedSteps = totalSteps;
						if (7 - pit === 3)
							game.opponent.stripHousePowers();
						$(".side-" + game.opponent.boardSide + " .pit[data-position=\"" + (7 - pit) + "\"]").data("pit-seeds", "0");
						$(".side-" + game.opponent.boardSide + " .pit[data-position=\"" + (7 - pit) + "\"]").html("");
						departingPoint = (direction === "left") ? -1 : -8;
					}
				} else {
					game.calculatedSteps = totalSteps;
				}
				game.relaySeeds(direction, departingPoint);
			}
		}, 1000);
	}
}

function startMove(game, direction, departingPoint) {
	var moves = game.currentPlayer.validMoves(game.opponent)
	  , seedsReserve = $(".side-" + game.currentPlayer.boardSide + " .seeds-reserve")
	  , pit = $(".side-" + game.currentPlayer.boardSide + " .pit.active")
	  , pitPosition = Number(pit.data("position"));
	if (!game.currentPlayer.initialMove() && pit.found()) {
		if (game.currentPlayer.taxMode) {
			if (seedsReserve.hasClass("active") && pit.hasClass("active")) {
				$(".pit, .seeds-reserve").removeClass("active allowed-pit");
				game.taxSeeds(direction);
			} else {
				console.log("Pick a seed from you reserve and select your house");
			}
		} else if (bawoGame.currentPlayer.relayMode && allowed(pitPosition, direction, moves) || allowed(departingPoint, direction, moves)) {
			$(".pit, .seeds-reserve").removeClass("active allowed-pit");
			if (game.capturedPit === 3)
				game.opponent.stripHousePowers();
			game.relaySeeds(direction, departingPoint);
		} else {
			console.log("You are not allowed to use that direction");
		}
	} else {
		console.log("Pick a seed and pit");
	}
}

/*!
* Handlers for UI Events
*/
var startingX, startingY, posX, posY, touchDirection, moveInteraction = 0;
$(".pit").on("touchstart mousedown", function(e) {
	touchDirection = null;
	moveInteraction = 0;
	var el;
	if (e.type == "touchstart") {
		el = e.targetTouches[0];
	} else if (e.type == "mousedown") {
		el = e;
	}
	startingX = el.clientX;
	startingY = el.clientY;
	if ($(this).hasClass("active") && bawoGame.currentPlayer.isHuman() && bawoGame.relayCounter === 0) {
		$(this).on("touchmove mousemove", function(e) {
			moveInteraction = 1;
			var sign = bawoGame.currentPlayer.boardSide === "a" && !bawoGame.autoRotate() ? -1 : 1, departingPoint = Number($(this).data("position")), el, direction = null;
			if (e.type == "touchmove") {
				el = e.targetTouches[0];
			} else if (e.type == "mousemove") {
				el = e;
			}
			posX = sign * (el.clientX - startingX);
			posY = sign * (el.clientY - startingY);
			if (e.type == "touchmove" && e.targetTouches.length !== 1)
				return;
			e.preventDefault();
			var threshHold = $(this).outerHeight() / 3;
			if (departingPoint < 8) {
				if (posX > 0 && posX > threshHold || departingPoint === 0 && posY > 0 && posY > threshHold) {
					direction = "right";
				} else if (posX < 0 && posX < threshHold || departingPoint === 7 && posY > 0 && posY > threshHold) {
					direction = "left";
				}
			} else {
				if (posX > 0 && posX > threshHold || departingPoint === 15 && posY < 0 && posY < threshHold) {
					direction = "left";
				} else if (posX < 0 && posX < threshHold || departingPoint === 8 && posY < 0 && posY < threshHold) {
					direction = "right";
				}
			}
			touchDirection = direction;
		});
	}
});
$(".pit").on("touchend touchcancel mouseup mouseleave", function() {
	if ($(this).hasClass("active") && bawoGame.currentPlayer.isHuman() && bawoGame.relayCounter === 0) {
		moveInteraction++;
		if (moveInteraction === 2 && touchDirection) {
			var direction = touchDirection, departingPoint;
			if (bawoGame.currentPlayer.relayMode) {
				if (direction === "right")
					departingPoint = -8;
				if (direction === "left")
					departingPoint = -1;
			} else {
				departingPoint = Number($(".side-" + bawoGame.currentPlayer.boardSide + " .pit.active").data("position"));
			}
			startMove(bawoGame, direction, departingPoint);
		} else {//console.log("Tap/Click your desired pit until its highlighted, Tap/Click and Hold and Swipe/Move towards your desired direction and release");
		}
	}
	$(this).off("mousemove touchmove");
});
$(document).on("touchstart mousedown", ".assistive-menu", function(e) {
	var el;
	if (e.type == "touchstart") {
		el = e.targetTouches[0];
	} else if (e.type == "mousedown") {
		el = e;
	}
	startingX = el.clientX - parseInt($(this).css("left"));
	startingY = el.clientY - parseInt($(this).css("top"));
	$(this).on("touchmove mousemove", function(e) {
		var top, left, el;
		if (e.type == "touchmove") {
			el = e.targetTouches[0];
		} else if (e.type == "mousemove") {
			el = e;
		}
		posX = el.clientX - startingX;
		posY = el.clientY - startingY;
		if (e.type == "touchmove" && e.targetTouches.length !== 1)
			return;
		if ((posY) <= 0) {
			top = 0;
		} else if (posY >= (screenHeight - $(this).outerHeight())) {
			top = screenHeight - $(this).outerHeight();
		} else {
			top = posY;
		}
		if (posX <= 0) {
			left = 0;
		} else if (posX >= (screenWidth - $(this).outerWidth())) {
			left = screenWidth - $(this).outerWidth();
		} else {
			left = posX;
		}
		if (top >= 0) {
			$(this).css("top", top + "px");
		}
		if (left >= 0) {
			$(this).css("left", left + "px");
		}
	});
});
$(document).on("touchend touchcancel mouseup mouseleave mouseout", ".assistive-menu", function() {
	$(this).off("mousemove touchmove");
});
var lastTap = 0;
$(".assistive-menu").on("click", function(e) {
	var undoOption = ""
	  , redoOption = "";
	if (bawoGame.playHistory.exist()) {
		undoOption = "<div class=\"btn btn-default menu-item undo-move\">Undo Move</div>\n";
	}
	if (bawoGame.playHistory.exist(true)) {
		redoOption = "<div class=\"btn btn-default menu-item redo-move\">Redo Move</div>\n";
	}
	var body = "<div class=\"menu-body d-flex\">\n" + undoOption + redoOption + "<div class=\"btn btn-default menu-item forfeit\">Exit</div>\n    <div class=\"btn btn-default menu-item settings\">Settings</div>\n    </div>";
	var currentTime = new Date().getTime()
	  , tapLength = currentTime - lastTap;
	e.preventDefault();
	if (tapLength > 0 && tapLength < 500) {
		if (bawoGame.relayCounter === 0) {
			Dialog("Menu", body, "", true).open();
		}
	}
	lastTap = currentTime;
});
$(document).on("click", ".minimise-modal", function(e) {
	$(".modal").addClass("modal-minimise").prepend("<div class=\"btn btn-default modal-expand\">Restore Dialog</div>");
	$(".modal-window").addClass("hidden");
});
$(document).on("click", ".modal-expand", function(e) {
	$(".modal").removeClass("modal-minimise");
	$(".modal-window").removeClass("hidden");
	$(".modal-expand").remove();
});
$(document).on("click", ".undo-move", function(e) {
	bawoGame.log.set("Undo", "Previous move was undone")
	Dialog().close();
	bawoGame.seekHistory(true);
});
$(document).on("click", ".redo-move", function(e) {
	bawoGame.log.set("Redo", "Undone move was was redone")
	Dialog().close();
	bawoGame.seekHistory();
});
$(document).on("click", ".pit", function() {
	if (bawoGame.relayCounter === 0) {
		var target = $(this)
		  , currentPlayer = bawoGame.currentPlayer
		  , opponent = bawoGame.opponent
		  , allowedMoves = currentPlayer.validMoves(opponent);
		if ($(this).closest(".side-" + bawoGame.currentPlayer.boardSide)) {
			var targetPosition = Number(target.data("position"))
			  , allowedRight = allowed(targetPosition, "right", allowedMoves)
			  , allowedLeft = allowed(targetPosition, "left", allowedMoves)
			  , moveRight = $(".side-" + bawoGame.currentPlayer.boardSide + " .move.right")
			  , moveLeft = $(".side-" + bawoGame.currentPlayer.boardSide + " .move.left");
			if (currentPlayer.namuaPhase) {
				var allowedHole = currentPlayer.initialMove() && currentPlayer.freeSowingSeeds ? true : allowed(targetPosition, null, allowedMoves);
				if (allowedHole) {
					if (currentPlayer.initialMove()) {
						if (!$(".sow-amount").found()) {
							currentPlayer.collectingSeeds = true;
							currentPlayer.freeSowingSeeds = false;
						}
						if ($(".seeds-reserve.active").found() && !$(this).hasClass("active") || $(".sow-amount").found()) {
							if (currentPlayer.collectingSeeds && targetPosition !== 3 || ((targetPosition === 3 && Number(target.data("pit-seeds")) > 8 || targetPosition !== 3) && !$(".sow-amount.active").found())) {
								bawoGame.setFreeSow(target, "collecting");
							} else if (currentPlayer.freeSowingSeeds && $(".sow-amount.active").found()) {
								bawoGame.setFreeSow(target, "sowing");
							}
						} else {
							console.log("Pick a seed.");
						}
					} else {
						var activeSidePit = $(".side-" + currentPlayer.boardSide + " .pit.active");
						if (!activeSidePit.found() || activeSidePit.data("position") == target.data("position")) {
							if ($(".seeds-reserve.active").found()) {
								var totalSteps = Number(target.data("pit-seeds"))
								  , checkPit = 7 - targetPosition
								  , opponentPit = $(".side-" + opponent.boardSide + " .pit[data-position=\"" + checkPit + "\"]")
								  , opponentPitTotal = Number(opponentPit.data("pit-seeds"));
								if (!currentPlayer.takataMode) {
									if (target.hasClass("active")) {
										totalSteps = totalSteps - 1;
										target.removeClass("active");
										opponent.insertSeeds(checkPit, bawoGame.calculatedSteps, false);
										opponentPit.data("pit-seeds", bawoGame.calculatedSteps);
										bawoGame.calculatedSteps = 0;
										bawoGame.capturedPit = null;
									} else {
										bawoGame.calculatedSteps = opponentPitTotal;
										bawoGame.capturedPit = checkPit;
										opponentPit.html("");
										opponentPit.data("pit-seeds", "0");
										totalSteps = totalSteps + 1;
										target.addClass("active");
										currentPlayer.captureMove().relayOn();
									}
								} else {
									if (target.hasClass("active")) {
										totalSteps = totalSteps - 1;
										target.removeClass("active");
									} else {
										totalSteps = totalSteps + 1;
										target.addClass("active");
									}
									bawoGame.calculatedSteps = totalSteps;
								}
								target.data("pit-seeds", "" + totalSteps);
								currentPlayer.insertSeeds(targetPosition, totalSteps, false);
							} else {
								console.log("Pick a seed please.");
							}
						} else {
							console.log("A pit is already selected, unselect it an select another one");
						}
					}
				} else {
					console.log("You cannot make a valid move from that pit");
				}
			} else {
				$(".pit").removeClass("active");
				if (allowed(targetPosition, null, allowedMoves)) {
					target.addClass("active");
					bawoGame.calculatedSteps = Number(target.data("pit-seeds"));
				} else {
					console.log("You can not use that pit. Look closer, there might be a pit you can use.");
				}
			}
			if (target.hasClass("active")) {
				if (allowedRight || allowedLeft)
					$(".side-" + bawoGame.currentPlayer.boardSide + ".footer .move-control").show();
				if (targetPosition < 8) {
					if (allowedRight) {
						moveRight.removeClass("disabled");
					} else {
						moveRight.addClass("disabled");
					}
					if (allowedLeft) {
						moveLeft.removeClass("disabled");
					} else {
						moveLeft.addClass("disabled");
					}
					if (allowedLeft && targetPosition === 7) {
						moveLeft.find("svg").css("transform", "rotate(-90deg)");
					} else {
						moveLeft.find("svg").css("transform", "rotate(0deg)");
					}
					if (allowedRight && targetPosition === 0) {
						moveRight.find("svg").css("transform", "rotate(90deg)");
					} else {
						moveRight.find("svg").css("transform", "rotate(0deg)");
					}
				} else if (targetPosition > 7) {
					if (allowedLeft) {
						moveRight.removeClass("disabled");
					} else {
						moveRight.addClass("disabled");
					}
					if (allowedRight) {
						moveLeft.removeClass("disabled");
					} else {
						moveLeft.addClass("disabled");
					}
					if (allowedRight && targetPosition === 8) {
						moveLeft.find("svg").css("transform", "rotate(90deg)");
					} else {
						moveLeft.find("svg").css("transform", "rotate(0deg)");
					}
					if (allowedLeft && targetPosition === 15) {
						moveRight.find("svg").css("transform", "rotate(-90deg)");
					} else {
						moveRight.find("svg").css("transform", "rotate(0deg)");
					}
				}
			} else {
				if (!$(".pit.active").found()) {
					$(".move").addClass("disabled");
					$(".move").find("svg").css("transform", "rotate(0deg)");
					$(".side-" + bawoGame.currentPlayer.boardSide + ".footer .move-control").hide();
				}
			}
		} else {
			console.log("Wait for your turn");
		}
	}
});
$(document).on("click", ".seeds-reserve", function() {
	if (bawoGame.currentPlayer.isHuman() && (this).closest(".side-" + bawoGame.currentPlayer.boardSide) && bawoGame.currentPlayer.namuaPhase) {
		$(this).toggleClass("active");
	}
});
$(document).on("click", ".sow-amount", function() {
	var i = $(this).index();
	if (i === $(".sow-amount.active").index()) {
		$(this).removeClass("active");
	} else {
		$(".sow-amount").removeClass("active").eq(i).toggleClass("active");
	}
	bawoGame.currentPlayer.collectingSeeds = false;
	bawoGame.currentPlayer.freeSowingSeeds = true;
});
$(document).on("click", ".accept-proceed", function() {
	var direction = $(this).data("direction")
	  , finalSowPit = Number($(this).data("final-pit"))
	  , moveSteps = Number($(this).data("movesteps"));
	bawoGame.calculatedSteps = moveSteps;
	bawoGame.currentPlayer.stripHousePowers();
	Dialog().close();
	bawoGame.relaySeeds(direction, finalSowPit);
});
$(document).on("click", ".relay-sleep", function() {
	bawoGame.breakRelay = true;
	$(".toast").removeClass("active").html("");
});
$(document).on("click", ".deny-proceed", function() {
	bawoGame.currentPlayer.decreaseReserve().relayOff();
	Dialog().close();
	bawoGame.switchPlayers().saveProgress();
});
var lastKeyUp = 0
  , lastkey = 0;
$(document).on("keyup", function(e) {
	if (bawoGame !== undefined && bawoGame.currentPlayer.isHuman() && bawoGame.relayCounter === 0) {
		if (e.keyCode === 83 && bawoGame.currentPlayer.namuaPhase)
			$(".side-" + bawoGame.currentPlayer.boardSide + " .seeds-reserve").addClass("active");
		if (e.keyCode >= 48 && e.keyCode <= 57) {
			if (bawoGame.currentPlayer.namuaPhase && $(".side-" + bawoGame.currentPlayer.boardSide + " .seeds-reserve").hasClass("active") || bawoGame.currentPlayer.mtagiPhase) {
				var currentTime = new Date().getTime()
				  , tapLength = currentTime - lastKeyUp
				  , finalPit = e.key;
				e.preventDefault();
				if (tapLength > 0 && tapLength < 1000) {
					finalPit = lastkey + finalPit;
				}
				if (parseInt(finalPit) < 17 && parseInt(finalPit) !== 0) {
					if ($(".pit.active").found())
						$(".pit.active").click();
					$(".side-" + bawoGame.currentPlayer.boardSide + " .pit[data-position=\"" + (parseInt(finalPit) - 1) + "\"]").click();
				}
				lastkey = e.key;
				lastKeyUp = currentTime;
			}
		}
		var activePit = $(".side-" + bawoGame.currentPlayer.boardSide + " .pit.active");
		if (e.keyCode >= 37 && e.keyCode <= 40 && activePit.found()) {
			var direction, departingPoint;
			if (bawoGame.currentPlayer.relayMode) {
				if (e.keyCode === 37) {
					departingPoint = -1;
					direction = "left";
				} else if (e.keyCode === 39) {
					departingPoint = -8;
					direction = "right";
				}
			} else {
				departingPoint = Number(activePit.data("position"));
				if (e.keyCode === 37 && departingPoint < 8 || e.keyCode === 38 && departingPoint === 15 || e.keyCode === 39 && departingPoint > 7 || e.keyCode === 40 && departingPoint === 7) {
					direction = "left";
				} else if (e.keyCode === 39 && departingPoint < 8 || e.keyCode === 38 && departingPoint === 8 || e.keyCode === 37 && departingPoint > 7 || e.keyCode === 40 && departingPoint === 0) {
					direction = "right";
				}
			}
			if (direction !== undefined) {
				startMove(bawoGame, direction, departingPoint);
			}
		}
	}
});
$(document).on("click", ".move", function() {
	var direction, departingPoint, activePit = $(".side-" + bawoGame.currentPlayer.boardSide + " .pit.active");
	if (activePit.found()) {
		if (bawoGame.currentPlayer.relayMode) {
			if ($(this).hasClass("right"))
				departingPoint = -8;
			if ($(this).hasClass("left"))
				departingPoint = -1;
		} else {
			departingPoint = Number(activePit.data("position"));
		}
		direction = departingPoint > 7 && $(this).hasClass("right") || departingPoint < 8 && $(this).hasClass("left") ? "left" : "right";
		if (bawoGame.currentPlayer.isHuman())
			startMove(bawoGame, direction, departingPoint);
	} else {
		console.log("Select a pit to make a valid move from");
	}
});
$(document).on("click", ".modal-dismiss-button", function() {
	Dialog().close();
});
$(document).on("click", ".accept-forfeit, .new-player", function() {
	bawoGame.log.set("End", "Game forfeited or new player to play with");
	localStorage.removeItem("bawoPlayInfo");
	bawoGame = undefined;
	Dialog().close();
	$(".page").removeClass("active")
	$(".page.home-page").addClass("active");
});
$(document).on("click", ".player-status", function() {
	$(".player-status").replaceClass("current-player", "opponent");
	$(".player-status.human-player").html(icons.avatar);
	$(this).replaceClass("opponent", "current-player");
	if ($(this).hasClass("human-player"))
		$(this).html(icons.activeAvatar);
});
$(document).on("click", ".delay-toggle", function() {
	var newValue, delayValue = $(".delay-value"), currentValue = Number(delayValue.data("delay-value"));
	if ($(this).hasClass("increase") && currentValue !== 500) {
		newValue = currentValue + 100;
	} else if ($(this).hasClass("decrease") && currentValue !== 100) {
		newValue = currentValue - 100;
	} else {
		newValue = currentValue;
	}
	delayValue.html(newValue);
	delayValue.data("delay-value", newValue);
	bawoGame.saveSettings();
});
$(document).on("click", ".settings", function() {
	Dialog().close();
	$(".page").removeClass("active");
	$(".page.settings-page").addClass("active");
});
$(document).on("click", ".get-back", function() {
	$(".page").removeClass("active");
	$(".page.game-page").addClass("active");
});
$(document).on("click", ".resume-game", function() {
	bawoGame.log.set("Resume", "Play resume");
	Dialog().close();
	setTimeout(function() {
		if (bawoGame.currentPlayer.isAI())
			initiateMove(bawoGame);
	}, 300);
});

$(document).on("click", ".game-restart", function() {
	if (!$(this).hasClass("ended")) {
		var _a = [bawoGame.currentPlayer, bawoGame.opponent]
		  , manager = JSON.parse(localStorage.getItem("gameManager"));
		if (manager.firstPlay !== bawoGame.currentPlayer.boardSide) {
			bawoGame.currentPlayer = _a[1];
			bawoGame.opponent = _a[0];
		}
	}
	bawoGame.playHistory.remove().remove(true);
	$(".player-timeline").empty();
	$(".pit, .seeds-reserve").removeClass("active");
	bawoGame.currentPlayer.turn = true;
	bawoGame.opponent.turn = false;
	bawoGame.initialSetUp();
	bawoGame.currentPlayer.setPhase().playMode(bawoGame.opponent);
	bawoGame.boardreflectCurrent(true).saveProgress();
	Dialog().close();
	bawoGame.log.set("Replay", "Game replayed");
});
$(document).on("click", ".forfeit", function() {
	var title = "Exit"
	  , body = "Exiting the game will remove current game state"
	  , footer = "<div class=\"d-flex justify-content-between w-100\"><div class=\"btn btn-default game-restart accept-defeat w-100 mr-10\">Replay</div><div class=\"btn btn-danger accept-forfeit w-100\">Exit</div></div>";
	Dialog(title, body, footer, true).open();
});
$(document).on("mouseover", ".pit", function() {
	var currentPlayer = bawoGame.currentPlayer;
	if ($(".side-" + currentPlayer.boardSide).found() && bawoGame.currentPlayer.isHuman() && bawoGame.relayCounter === 0) {
		if (currentPlayer.freeSowingSeeds || allowed(Number($(this).data("position")), null, currentPlayer.validMoves(bawoGame.opponent))) {
			if (bawoGame.settings.moveHighlighter) {
				$(this).addClass("allowed-pit");
			}
		}
	}
});
$(document).on("mouseout", ".pit", function() {
	$(".pit.allowed-pit").removeClass("allowed-pit");
});
$(document).on("change", "input[type='checkbox']", function() {
	bawoGame.saveSettings().boardreflectCurrent(false);
});
$(document).on("click", ".switch-player", function() {
	if ($(".side-a-contender  .player-status").hasClass("human-player")) {
		$(".side-a-contender  .player-status").replaceClass("human-player", "ai-player");
		$(".side-a-contender  .player-status").html(icons.laptop);
		$(this).html(icons.avatar);
		$(".difficulty-options").show();
		$(".side-a-contender input[type=\"text\"]").val("AI");
	} else {
		$(".side-a-contender  .player-status").replaceClass("ai-player", "human-player");
		$(".difficulty-options").hide();
		$(".side-a-contender input[type=\"text\"]").val("");
		if ($(".side-a-contender  .player-status").hasClass("current-player")) {
			$(".side-a-contender  .player-status").html(icons.activeAvatar);
		} else {
			$(".side-a-contender  .player-status").html(icons.avatar);
		}
		$(this).html(icons.laptop);
	}
});
$(document).on("submit", ".contenders-form", function(e) {
	e.preventDefault();
	$(".pit, .seeds-reserve").removeClass("active allowed-pit");
	$(".player-timeline").html("");
	var bawoPlayers = [], sideAPlayer, sideBPlayer, sideAName = $(".side-a-contender input").val(), sideBName = $(".side-b-contender input").val(), sideALife = $(".side-a-contender .player-status").hasClass("human-player") ? "human" : "ai", sideBLife = $(".side-b-contender .player-status").hasClass("human-player") ? "human" : "ai", gameVersion = $("input[name=\"version\"]:checked").val(), difficultyLevel = $("input[name=\"difficulty\"]:checked").val();
	if (sideAName && sideBName) {
		sideAPlayer = Player(sideAName, "a", sideALife);
		sideBPlayer = Player(sideBName, "b", sideBLife);
		bawoPlayers = [sideAPlayer, sideBPlayer];
		bawoGame = Game(Number(gameVersion), Number(difficultyLevel));
		if ($(".side-a-contender .player-status").hasClass("current-player")) {
			bawoGame.currentPlayer = sideAPlayer;
			bawoGame.opponent = sideBPlayer;
			bawoGame.firstPlay = "a";
		} else if ($(".side-b-contender .player-status").hasClass("current-player")) {
			bawoGame.currentPlayer = sideBPlayer;
			bawoGame.opponent = sideAPlayer;
			bawoGame.firstPlay = "b";
		}
		bawoGame.playHistory.remove().remove(true);
		bawoGame.currentPlayer.turn = true;
		bawoGame.opponent.turn = false;
		bawoGame.initialSetUp().saveProgress();
		var a_;
		if (localStorage.getItem("gameManager")) {
			var a_ = JSON.parse(localStorage.getItem("gameManager"));
			a_["firstPlay"] = bawoGame.firstPlay;
			a_["level"] = bawoGame.level;
			a_["type"] = bawoGame.type;
		} else {
			var a_ = {
				firstPlay: bawoGame.firstPlay,
				type: bawoGame.type,
				level: bawoGame.level,
				settings: bawoGame.settings
			}
		}
		localStorage.setItem("gameManager", JSON.stringify(a_));
		bawoGame.setSettings();
		bawoGame.log.set("New Game", {
			player: bawoGame.currentPlayer.name,
			opponent: bawoGame.opponent.name,
			type: bawoGame.type,
			level: bawoGame.level
		});
		$(".page").removeClass("active");
		$(".page.game-page").addClass("active");
		bawoGame.boardreflectCurrent(true);
	}
});
$(window).on("resize", function() {
	if (bawoGame !== undefined) {
		var players = [bawoGame.currentPlayer, bawoGame.opponent];
		centerFooter(players[0], players[0].boardSide === "a" && !bawoGame.autoRotate() ? "top" : "bottom");
		for (var i = 0; i < players.length; i++) {
			var pit = $(".side-" + players[i].boardSide + " .pit")
			  , totalPits = pit.get().length;
			for (var j = 0; j < totalPits; j++) {
				var pitTotal = Number($(".side-" + players[i].boardSide + " .pit[data-position=\"" + j + "\"]").data("pit-seeds"));
				players[i].insertSeeds(j, pitTotal, false);
				players[i].insertSeeds(0, players[i].reserve, true);
			}
		}
	}
	screenHeight = $("body").outerHeight();
	screenWidth = $("body").outerWidth();
	assistiveMenu = $(".assistive-menu");
	if ((parseInt(assistiveMenu.css("top")) + parseInt(assistiveMenu.outerHeight())) > screenHeight) {
		assistiveMenu.css("top", (screenHeight - parseInt(assistiveMenu.outerHeight())) + "px");
	}
	if ((parseInt(assistiveMenu.css("left")) + parseInt(assistiveMenu.outerWidth())) > screenWidth) {
		assistiveMenu.css("left", (screenWidth - parseInt(assistiveMenu.outerWidth())) + "px");
	}
});

$(function() {
	if (localStorage.getItem('bawoPlayInfo') && localStorage.getItem('gameManager')) {
		var gameManager = JSON.parse(localStorage.getItem('gameManager')), gameLevel = gameManager.level, level, levels = ["easy", "medium", "hard"], type = gameManager.type === "basic" ? 0 : 1;
		for (var i = 0; i < levels.length; i++) {
			if (levels[i] === gameLevel) {
				level = i;
				break;
			}
		}
		bawoGame = Game(type, level);
		bawoGame.firstPlay = gameManager.firstPlay;
		bawoGame.loadProgress().setSettings();
		$(".page").removeClass("active");
		$(".page.game-page").addClass("active");
		var footer = "<div class=\"d-flex justify-content-between w-100\"><div class=\"d-flex\"><div class=\"btn btn-default resume-game mr-10\">Resume</div><div class=\"btn btn-default game-restart mr-10\">Restart</div></div><div class=\"btn btn-danger accept-forfeit\">Exit</div></div>";
		Dialog("Welcome back", "Well the choice is yours, seeds needs to be sown though", footer, false).open();
		bawoGame.boardreflectCurrent(true);
	}
	setTimeout(function() {
		$(".loader-capsule").css("visibility", "hidden");
		$(".container").removeClass("hidden");
	}, 1000);
});